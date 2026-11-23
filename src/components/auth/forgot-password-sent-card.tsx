"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useEffect, useId } from "react";
import { AUTH_DESCRIPTION_CLASS, AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/ui/form-alert";
import { authApi } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-errors";
import { type ResetRequest, startCooldown, useCooldownUntil, useResetRequest } from "@/lib/flow-storage";
import { useAuthErrorText } from "@/lib/use-auth-error";
import { useCountdown } from "@/lib/use-countdown";

// Plain white links under the message, as in the design of this screen (the form screens use lavender).
const LINK_CLASS =
  "cursor-pointer text-xs-plus font-medium text-white transition-colors hover:text-primary focus-visible:text-primary disabled:cursor-not-allowed disabled:text-white/50 motion-reduce:transition-none";

/**
 * "Check your inbox". The request is remembered, so the screen comes back after a reload, resend countdown
 * included. Without a recent request there is nothing to confirm: back to the form.
 * Same three-state pattern as VerifyCard: undefined = not read yet, null = nothing stored, object = show it.
 */
export function ForgotPasswordSentCard() {
  const request = useResetRequest();
  const router = useRouter();
  const { locale } = useLocale();
  const content = useIntlayer("forgot-password");

  useEffect(() => {
    if (request === null) router.replace(`/${locale}/forgot-password`);
  }, [request, locale, router]);

  if (!request) {
    return (
      <AuthCard aria-busy="true">
        <AuthCardHeader title={`${content.sentTitle}`} />
      </AuthCard>
    );
  }

  return <Sent request={request} />;
}

function Sent({ request }: { request: ResetRequest }) {
  const { locale } = useLocale();
  const content = useIntlayer("forgot-password");
  const common = useIntlayer("common");
  const errorText = useAuthErrorText();
  const titleId = useId();
  // The deadline was stored when the link was requested, so the countdown starts at ~30 s and survives a reload.
  const cooldown = useCountdown(useCooldownUntil("reset"));

  // Resending asks for a brand-new link; the server invalidates the previous one.
  const resend = useMutation({
    mutationFn: () => authApi.requestPasswordReset(request.email, `/${locale}/reset-password`),
    onSuccess: () => startCooldown("reset"),
    onError: (error) => {
      if (error instanceof AuthError && error.key === "tooManyRequests") startCooldown("reset", error.retryAfter);
    },
  });
  const failure = resend.isError ? errorText(resend.error, cooldown) : null;

  return (
    <AuthCard aria-labelledby={titleId}>
      <div className="flex flex-col items-center gap-10">
        <AuthCardHeader
          titleId={titleId}
          title={`${content.sentTitle}`}
          description={`${content.sentDescription}`}
          descriptionClassName={AUTH_DESCRIPTION_CLASS}
        />

        <div className="flex flex-col items-center gap-4">
          {/* Not in the design: a confirmation that a new link really left (role="status" for screen readers). */}
          {resend.isSuccess && !failure && <FormAlert tone="success">{content.resent}</FormAlert>}
          {failure && <FormAlert>{failure}</FormAlert>}

          <button
            type="button"
            className={LINK_CLASS}
            disabled={cooldown > 0 || resend.isPending}
            onClick={() => resend.mutate()}
          >
            {content.resend}
            {cooldown > 0 && ` (${cooldown}s)`}
          </button>
          <Link href={`/${locale}/login`} className={LINK_CLASS}>
            {common.backToLogin}
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
