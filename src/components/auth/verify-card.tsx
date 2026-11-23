"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AUTH_FORM_WIDTH, AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { emptyOtp, OtpInput, type OtpInputHandle } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { authApi } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-errors";
import {
  clearMfaAttempt,
  EMAIL_CODE_TTL_MS,
  getCooldownUntil,
  type MfaAttempt,
  markEmailCodeSent,
  startCooldown,
  useCooldownUntil,
  useMfaAttempt,
} from "@/lib/flow-storage";
import { type RecoveryCodeValues, recoveryCodeSchema, type ValidationKey } from "@/lib/schemas";
import { useAuthErrorText, useRetryWindow } from "@/lib/use-auth-error";
import { useCountdown } from "@/lib/use-countdown";

// The small lavender links under the code cells; they dim when disabled (e.g. during the resend delay).
const LINK_CLASS =
  "cursor-pointer text-xs-plus font-medium text-[#C1B9EA] transition-colors hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:text-[#C1B9EA]/50 disabled:hover:text-[#C1B9EA]/50 motion-reduce:transition-none";

type Mode = "code" | "recovery";

/**
 * Second step of the sign-in. It only exists while a sign-in is waiting for it: the login screen records which
 * methods the account has, and a reload of this page finds them again. Without one, it sends you back to the login.
 *
 * Three states, decided by `useMfaAttempt()`:
 *   undefined  not read yet (server render, hydration)  → an empty frame, never a wrong screen
 *   null       no sign-in waiting (or it expired)       → back to the login page
 *   object     { methods, startedAt, emailSentAt }      → the real screen
 */
export function VerifyCard() {
  const attempt = useMfaAttempt();
  const router = useRouter();
  const { locale } = useLocale();
  const verify = useIntlayer("verify");
  const finished = useRef(false);

  useEffect(() => {
    // `undefined` means "storage not read yet" (server render, hydration, hence every hard refresh): decide
    // nothing. Treating it like `null` sent a refreshed page back to the login before storage was even read.
    if (attempt === undefined) return;
    // `finished` only covers the moment between a successful check and leaving the page; Next keeps this page
    // alive afterwards, so a later visit must start from scratch.
    if (attempt) finished.current = false;
    else if (!finished.current) router.replace(`/${locale}/login`);
  }, [attempt, locale, router]);

  if (!attempt) {
    // Not read yet, or about to leave: just the frame, never a wrong screen.
    return (
      <AuthCard aria-busy="true">
        <AuthCardHeader title={`${verify.title}`} />
      </AuthCard>
    );
  }

  return (
    <VerifyScreen
      attempt={attempt}
      onFinished={() => {
        // Set before clearing, so the effect above doesn't treat the cleared attempt as "send me back to login".
        finished.current = true;
        clearMfaAttempt();
      }}
    />
  );
}

/**
 * The screen itself. What it shows depends on the account's methods:
 *   app only       six cells + "use a recovery code"
 *   app + email    the same + a link to send an email code
 *   email only     the code is sent on arrival, the link only offers to resend it
 * plus the recovery-code form, reachable from all of them.
 */
function VerifyScreen({ attempt, onFinished }: { attempt: MfaAttempt; onFinished: () => void }) {
  const { locale } = useLocale();
  const router = useRouter();
  const verify = useIntlayer("verify");
  const common = useIntlayer("common");
  const errorText = useAuthErrorText();
  const retry = useRetryWindow(); // delay after a 429 on a verification attempt
  const titleId = useId();
  const errorId = useId();

  const hasApp = attempt.methods.includes("totp");
  const hasEmail = attempt.methods.includes("otp");

  const [mode, setMode] = useState<Mode>("code");
  const [digits, setDigits] = useState(emptyOtp); // the six cells ("" or one digit each)
  const [expired, setExpired] = useState(false); // the server dropped the sign-in attempt (10 minutes)
  const otp = useRef<OtpInputHandle>(null);

  // Seconds left before another email code may be requested (a stored deadline, so right after a reload too).
  const cooldown = useCountdown(useCooldownUntil("otp"));

  const finish = () => {
    onFinished();
    router.replace(`/${locale}/account`);
  };

  // Two failures need more than a message: the attempt expired (offer a way back) and a rate limit (disable).
  const noteFailure = (error: unknown) => {
    if (!(error instanceof AuthError)) return;
    if (error.key === "attemptExpired") setExpired(true);
    if (error.key === "tooManyRequests" && error.retryAfter) retry.start(error.retryAfter);
  };

  // ---- Checking the six digits ---------------------------------------------------------------------------------
  const verifyCode = useMutation({
    mutationFn: async (code: string) => {
      if (!hasEmail) return authApi.verifyTotp(code);
      if (!hasApp) return authApi.verifyOtp(code);
      // Both methods: the code may come from either. The app's code is checked first; if it is not that one
      // and an email code left less than 3 minutes ago, it may be the email's.
      try {
        return await authApi.verifyTotp(code);
      } catch (error) {
        const emailCodeAlive = attempt.emailSentAt !== undefined && Date.now() - attempt.emailSentAt < EMAIL_CODE_TTL_MS;
        if (error instanceof AuthError && error.key === "invalidCode" && emailCodeAlive) return authApi.verifyOtp(code);
        throw error;
      }
    },
    onSuccess: finish,
    onError: (error) => {
      setDigits(emptyOtp()); // a refused code is never worth keeping: start over
      noteFailure(error);
    },
  });

  // ---- Sending an email code -------------------------------------------------------------------------------------
  const sendEmailCode = useMutation({
    mutationFn: () => authApi.sendOtp(),
    onSuccess: () => {
      markEmailCodeSent();
      startCooldown("otp"); // blocks the link for 30 s, and survives a reload
    },
    onError: (error) => {
      if (error instanceof AuthError && error.key === "tooManyRequests") {
        // A code left less than 30 s ago (before a reload, from another tab): wait out the delay, it is not an error.
        markEmailCodeSent();
        startCooldown("otp", error.retryAfter);
      }
    },
  });

  // With the email as only method, the code is sent as soon as the screen opens (unless one just left).
  // The ref makes the effect run its body once: React runs effects twice in development, and a second call
  // would hit the 30 s rate limit. The stored deadline covers the other case, a reload within the delay.
  const autoSent = useRef(false);
  const { mutate: sendCode } = sendEmailCode; // `mutate` is stable; the whole mutation object is not
  useEffect(() => {
    if (autoSent.current || hasApp || !hasEmail) return;
    autoSent.current = true;
    if (getCooldownUntil("otp")) return;
    sendCode();
  }, [hasApp, hasEmail, sendCode]);

  // Focus management: the first cell when the code form is shown…
  useEffect(() => {
    if (mode === "code") otp.current?.focus();
  }, [mode]);

  // …and again after a refused code (the cells were emptied).
  const refused = verifyCode.isError;
  useEffect(() => {
    if (refused) otp.current?.focus();
  }, [refused]);

  const switchMode = (next: Mode) => {
    verifyCode.reset();
    setDigits(emptyOtp());
    setMode(next);
  };

  const goBackToLogin = () => {
    clearMfaAttempt();
    router.replace(`/${locale}/login`);
  };

  // A 429 on "send" is handled silently above (it just starts the countdown); anything else is shown.
  const emailSendFailed =
    sendEmailCode.isError && !(sendEmailCode.error instanceof AuthError && sendEmailCode.error.key === "tooManyRequests");
  const failure = verifyCode.isError
    ? errorText(verifyCode.error, retry.seconds)
    : emailSendFailed
      ? errorText(sendEmailCode.error)
      : null;

  // "Send a code by email" until a code has left (always "Resend" when email is the only method).
  const emailLinkLabel = !hasApp || attempt.emailSentAt !== undefined ? verify.resend : verify.sendByEmail;
  // One explanation per combination of methods, as in the design.
  const help =
    mode === "recovery"
      ? verify.helpRecovery
      : hasApp && hasEmail
        ? verify.helpAppAndEmail
        : hasApp
          ? verify.helpApp
          : verify.helpEmail;

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader titleId={titleId} title={`${mode === "code" ? verify.title : verify.recoveryTitle}`} />

        {mode === "code" ? (
          <div className="flex w-full flex-col items-center gap-3">
            <OtpInput
              ref={otp}
              value={digits}
              onChange={(next) => {
                if (verifyCode.isError) verifyCode.reset(); // typing again clears the previous refusal
                setDigits(next);
              }}
              onComplete={(code) => verifyCode.mutate(code)} // the sixth digit submits
              groupLabel={`${verify.codeGroupLabel}`}
              cellLabel={(position) => `${verify.digit} ${position} / ${digits.length}`}
              busy={verifyCode.isPending || retry.seconds > 0}
              invalid={Boolean(failure)}
              describedBy={failure ? errorId : undefined}
            />

            {failure && (
              <p id={errorId} role="alert" className="text-center text-sx text-danger">
                {failure}
              </p>
            )}

            <div className="mt-1 flex flex-col items-center gap-2">
              {hasEmail && (
                <button
                  type="button"
                  className={LINK_CLASS}
                  disabled={cooldown > 0 || sendEmailCode.isPending}
                  onClick={() => {
                    verifyCode.reset(); // a new code starts a clean attempt
                    sendEmailCode.mutate();
                  }}
                >
                  {emailLinkLabel}
                  {cooldown > 0 && <span className="text-white"> ({cooldown}s)</span>}
                </button>
              )}
              <button type="button" className={LINK_CLASS} onClick={() => switchMode("recovery")}>
                {verify.useRecovery}
              </button>
            </div>
          </div>
        ) : (
          <RecoveryForm onSuccess={finish} onFailure={noteFailure} onUseCode={() => switchMode("code")} />
        )}

        {/* Shown only when the server dropped the sign-in attempt: nothing here can work any more. */}
        {expired && (
          <button type="button" className={LINK_CLASS} onClick={goBackToLogin}>
            {common.backToLogin}
          </button>
        )}

        <p className="max-w-[31.25rem] text-center text-sx leading-[1.35] text-white">{help}</p>
      </div>

      {/* Announced to screen readers only: the visible feedback is the countdown and the cells themselves. */}
      <p role="status" className="sr-only">
        {verifyCode.isPending ? verify.verifying : sendEmailCode.isSuccess ? verify.emailSent : ""}
      </p>
    </AuthCard>
  );
}

/** The recovery-code alternative: one text field, one single-use code (the server invalidates it once used). */
function RecoveryForm({
  onSuccess,
  onFailure,
  onUseCode,
}: {
  onSuccess: () => void;
  onFailure: (error: unknown) => void;
  onUseCode: () => void;
}) {
  const verify = useIntlayer("verify");
  const validation = useIntlayer("validation");
  const errorText = useAuthErrorText();
  const retry = useRetryWindow();

  const form = useForm<RecoveryCodeValues>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { code: "" },
  });
  const key = form.formState.errors.code?.message;

  const verifyBackupCode = useMutation({
    mutationFn: ({ code }: RecoveryCodeValues) => authApi.verifyBackupCode(code),
    onSuccess,
    onError: (error) => {
      if (error instanceof AuthError && error.key === "tooManyRequests" && error.retryAfter) {
        retry.start(error.retryAfter);
      }
      onFailure(error); // lets the parent show "attempt expired" if that is what happened
    },
  });
  const failure = verifyBackupCode.isError ? errorText(verifyBackupCode.error, retry.seconds) : null;

  return (
    <>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => verifyBackupCode.mutate(values))}
        className={`${AUTH_FORM_WIDTH} flex flex-col`}
      >
        {/* No autocomplete, no capitalisation, no spell-check: a recovery code is not a word. */}
        <TextField
          label={verify.recoveryLabel}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          errorMessage={key ? `${validation[key as ValidationKey]}` : undefined}
          {...form.register("code")}
        />
        {failure && <FormAlert className="mt-4">{failure}</FormAlert>}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          alignment="center"
          textSize="base"
          // Safe to key on isSuccess here: on success the parent clears the attempt and this form unmounts.
          isLoading={verifyBackupCode.isPending || verifyBackupCode.isSuccess}
          disabled={retry.seconds > 0}
          className="mt-8 h-[3.125rem] w-full hover:bg-primary-300"
        >
          {verify.recoverySubmit}
        </Button>
      </form>
      <button type="button" className={LINK_CLASS} onClick={onUseCode}>
        {verify.useCode}
      </button>
    </>
  );
}
