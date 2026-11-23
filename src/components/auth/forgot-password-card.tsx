"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useId, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  AUTH_DESCRIPTION_CLASS,
  AUTH_FORM_WIDTH,
  AuthCard,
  AuthCardHeader,
} from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { authApi } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-errors";
import { saveResetRequest, startCooldown, useCooldownUntil } from "@/lib/flow-storage";
import { type ForgotPasswordValues, forgotPasswordSchema, type ValidationKey } from "@/lib/schemas";
import { useAuthErrorText } from "@/lib/use-auth-error";
import { useCountdown } from "@/lib/use-countdown";

/**
 * Asks for a reset link. The server answers the same way whether the account exists or not (so the screen cannot
 * be used to find out who has an account). On success it remembers the request and moves on to /forgot-password/sent.
 */
export function ForgotPasswordCard() {
  const { locale } = useLocale();
  const router = useRouter();
  const content = useIntlayer("forgot-password");
  const common = useIntlayer("common");
  const validation = useIntlayer("validation");
  const errorText = useAuthErrorText();
  const titleId = useId();
  const [isNavigating, startNavigation] = useTransition();

  // The server lets a link out once per 30 s: the button shows what is left, even after a reload.
  const cooldown = useCountdown(useCooldownUntil("reset"));

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const key = form.formState.errors.email?.message;

  const requestLink = useMutation({
    // redirectTo carries the language: the link lands on /fr/reset-password or /en/reset-password.
    mutationFn: ({ email }: ForgotPasswordValues) => authApi.requestPasswordReset(email, `/${locale}/reset-password`),
    onSuccess: (_result, { email }) => {
      saveResetRequest(email); // so the "sent" screen can come back after a reload, and resend
      startCooldown("reset");
      form.reset(); // Next keeps this page alive in the background: don't leave the address in the field
      startNavigation(() => router.push(`/${locale}/forgot-password/sent`));
    },
    onError: (error) => {
      // A link left less than 30 s ago: the button waits out the delay the server announced.
      if (error instanceof AuthError && error.key === "tooManyRequests") startCooldown("reset", error.retryAfter);
    },
  });
  const failure = requestLink.isError ? errorText(requestLink.error, cooldown) : null;

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader
          titleId={titleId}
          title={`${content.title}`}
          description={`${content.description}`}
          descriptionClassName={AUTH_DESCRIPTION_CLASS}
        />

        <form
          noValidate
          onSubmit={form.handleSubmit((values) => requestLink.mutate(values))}
          className={`${AUTH_FORM_WIDTH} flex flex-col`}
        >
          <TextField
            type="email"
            label={common.email}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            errorMessage={key ? `${validation[key as ValidationKey]}` : undefined}
            {...form.register("email")}
          />
          {failure && <FormAlert className="mt-4">{failure}</FormAlert>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            alignment="center"
            textSize="base"
            isLoading={requestLink.isPending || isNavigating}
            disabled={cooldown > 0}
            className="mt-8 h-[3.125rem] w-full hover:bg-primary-300"
          >
            {content.submit}
            {/* "Envoyer le lien (12s)" while the server would refuse another request */}
            {cooldown > 0 && ` (${cooldown}s)`}
          </Button>
        </form>

        <Button asChild variant="ghostMedium">
          <Link href={`/${locale}/login`}>{common.backToLogin}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
