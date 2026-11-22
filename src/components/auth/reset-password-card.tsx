"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { AUTH_FORM_WIDTH, AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordInput } from "@/components/ui/password-input";
import { authApi } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-errors";
import { type ResetPasswordValues, resetPasswordSchema, type ValidationKey } from "@/lib/schemas";
import { useAuthErrorText, useRetryWindow } from "@/lib/use-auth-error";

const PRIMARY_LINK = "h-[3.125rem] w-full max-w-[30rem] hover:bg-primary-300";

type Outcome = "done" | "invalid" | null;

/**
 * Where the reset link lands: `?token=…` for a good link, `?error=INVALID_TOKEN` when the server already
 * knows it is expired or used. A link that stops being valid while the form is open ends in the same message.
 */
export function ResetPasswordCard() {
  const params = useSearchParams();
  const token = params.get("token");
  const linkRefused = params.has("error");
  const [outcome, setOutcome] = useState<Outcome>(null);

  if (outcome === "done") return <SuccessView />;
  if (outcome === "invalid" || linkRefused || !token) return <InvalidLinkView />;
  return <ResetForm token={token} onDone={() => setOutcome("done")} onInvalid={() => setOutcome("invalid")} />;
}

function ResetForm({ token, onDone, onInvalid }: { token: string; onDone: () => void; onInvalid: () => void }) {
  const content = useIntlayer("reset-password");
  const common = useIntlayer("common");
  const validation = useIntlayer("validation");
  const { locale } = useLocale();
  const errorText = useAuthErrorText();
  const retry = useRetryWindow();
  const titleId = useId();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const fieldError = (key?: string) => (key ? `${validation[key as ValidationKey]}` : undefined);
  const visibilityLabels = { show: `${common.showPassword}`, hide: `${common.hidePassword}` };

  const reset = useMutation({
    mutationFn: ({ password }: ResetPasswordValues) => authApi.resetPassword(password, token),
    onSuccess: onDone,
    onError: (error) => {
      if (!(error instanceof AuthError)) return;
      if (error.key === "invalidToken") onInvalid();
      if (error.key === "tooManyRequests" && error.retryAfter) retry.start(error.retryAfter);
    },
  });
  const failure = reset.isError ? errorText(reset.error, retry.seconds) : null;

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader
          titleId={titleId}
          title={`${content.title}`}
          description={`${content.description}`}
        />

        <form
          noValidate
          onSubmit={form.handleSubmit((values) => reset.mutate(values))}
          className={`${AUTH_FORM_WIDTH} flex flex-col`}
        >
          <div className="flex flex-col gap-4">
            <PasswordInput
              label={content.newPassword}
              autoComplete="new-password"
              visibilityLabels={visibilityLabels}
              errorMessage={fieldError(errors.password?.message)}
              {...form.register("password")}
            />
            <PasswordInput
              label={content.confirmPassword}
              autoComplete="new-password"
              visibilityLabels={visibilityLabels}
              errorMessage={fieldError(errors.confirmPassword?.message)}
              {...form.register("confirmPassword")}
            />
          </div>
          {failure && <FormAlert className="mt-4">{failure}</FormAlert>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            alignment="center"
            textSize="base"
            isLoading={reset.isPending || reset.isSuccess}
            disabled={retry.seconds > 0}
            className="mt-8 h-[3.125rem] w-full hover:bg-primary-300"
          >
            {content.submit}
          </Button>
        </form>

        <Button asChild variant="ghostMedium">
          <Link href={`/${locale}/login`}>{common.backToLogin}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

function SuccessView() {
  const content = useIntlayer("reset-password");
  const { locale } = useLocale();
  const titleId = useId();

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader
          titleId={titleId}
          title={`${content.successTitle}`}
          description={`${content.successDescription}`}
        />
        <Button asChild variant="primary" size="lg" alignment="center" textSize="base" className={PRIMARY_LINK}>
          <Link href={`/${locale}/login`}>{content.successAction}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

function InvalidLinkView() {
  const content = useIntlayer("reset-password");
  const common = useIntlayer("common");
  const { locale } = useLocale();
  const titleId = useId();

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader
          titleId={titleId}
          title={`${content.invalidTitle}`}
          description={`${content.invalidDescription}`}
        />
        <Button asChild variant="primary" size="lg" alignment="center" textSize="base" className={PRIMARY_LINK}>
          <Link href={`/${locale}/forgot-password`}>{content.invalidAction}</Link>
        </Button>
        <Button asChild variant="ghostMedium">
          <Link href={`/${locale}/login`}>{common.backToLogin}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
