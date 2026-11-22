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

const LINK_CLASS =
  "cursor-pointer text-xs-plus font-medium text-[#C1B9EA] transition-colors hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:text-[#C1B9EA]/50 disabled:hover:text-[#C1B9EA]/50 motion-reduce:transition-none";

type Mode = "code" | "recovery";

/**
 * Second step of the sign-in. It only exists while a sign-in is waiting for it: the login screen records which
 * methods the account has, and a reload of this page finds them again. Without one, it sends you back to the login.
 */
export function VerifyCard() {
  const attempt = useMfaAttempt();
  const router = useRouter();
  const { locale } = useLocale();
  const verify = useIntlayer("verify");
  const finished = useRef(false);

  useEffect(() => {
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
        finished.current = true;
        clearMfaAttempt();
      }}
    />
  );
}

function VerifyScreen({ attempt, onFinished }: { attempt: MfaAttempt; onFinished: () => void }) {
  const { locale } = useLocale();
  const router = useRouter();
  const verify = useIntlayer("verify");
  const common = useIntlayer("common");
  const errorText = useAuthErrorText();
  const retry = useRetryWindow();
  const titleId = useId();
  const errorId = useId();

  const hasApp = attempt.methods.includes("totp");
  const hasEmail = attempt.methods.includes("otp");

  const [mode, setMode] = useState<Mode>("code");
  const [digits, setDigits] = useState(emptyOtp);
  const [expired, setExpired] = useState(false);
  const otp = useRef<OtpInputHandle>(null);

  const cooldown = useCountdown(useCooldownUntil("otp"));

  const finish = () => {
    onFinished();
    router.replace(`/${locale}/account`);
  };

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
      setDigits(emptyOtp());
      noteFailure(error);
    },
  });

  // ---- Sending an email code -------------------------------------------------------------------------------------
  const sendEmailCode = useMutation({
    mutationFn: () => authApi.sendOtp(),
    onSuccess: () => {
      markEmailCodeSent();
      startCooldown("otp");
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
  const autoSent = useRef(false);
  const { mutate: sendCode } = sendEmailCode;
  useEffect(() => {
    if (autoSent.current || hasApp || !hasEmail) return;
    autoSent.current = true;
    if (getCooldownUntil("otp")) return;
    sendCode();
  }, [hasApp, hasEmail, sendCode]);

  useEffect(() => {
    if (mode === "code") otp.current?.focus();
  }, [mode]);

  // After a refused code the cells are empty again: back to the first one.
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

  const emailSendFailed =
    sendEmailCode.isError && !(sendEmailCode.error instanceof AuthError && sendEmailCode.error.key === "tooManyRequests");
  const failure = verifyCode.isError
    ? errorText(verifyCode.error, retry.seconds)
    : emailSendFailed
      ? errorText(sendEmailCode.error)
      : null;

  const emailLinkLabel = !hasApp || attempt.emailSentAt !== undefined ? verify.resend : verify.sendByEmail;
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
              onComplete={(code) => verifyCode.mutate(code)}
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
      onFailure(error);
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
