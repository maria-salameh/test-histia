"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useForm } from "react-hook-form";
import { LegalLinks } from "@/components/auth/legal-links";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordInput } from "@/components/ui/password-input";
import { TextField } from "@/components/ui/text-field";
import { authApi } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-errors";
import { type MfaMethod, saveMfaAttempt } from "@/lib/flow-storage";
import { type LoginValues, loginSchema, type ValidationKey } from "@/lib/schemas";
import { useAuthErrorText, useRetryWindow } from "@/lib/use-auth-error";

/** What sign-in answers when the account has a second step (the server lists its methods; the client types don't). */
type SignInResult = { twoFactorRedirect?: boolean; twoFactorMethods?: string[] };

/** Keeps the methods this screen knows how to ask for. If the server lists none, the app code is the safe bet. */
const toMethods = (methods: readonly string[] | undefined): MfaMethod[] => {
  const known = (methods ?? []).filter((method): method is MfaMethod => method === "totp" || method === "otp");
  return known.length > 0 ? known : ["totp"];
};

export function LoginForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const auth = useIntlayer("auth");
  const common = useIntlayer("common");
  const validation = useIntlayer("validation");
  const errorText = useAuthErrorText();
  const retry = useRetryWindow();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;
  const fieldError = (key?: string) => (key ? `${validation[key as ValidationKey]}` : undefined);

  const signIn = useMutation({
    mutationFn: ({ email, password }: LoginValues) => authApi.signIn(email, password),
    onSuccess: (result) => {
      const { twoFactorRedirect, twoFactorMethods } = result as SignInResult;
      if (twoFactorRedirect) {
        // The account has a second step: remember which ones (the server only says it now) and go verify.
        saveMfaAttempt(toMethods(twoFactorMethods));
        router.push(`/${locale}/verify`);
      } else {
        router.replace(`/${locale}/account`);
      }
    },
    onError: (error) => {
      if (error instanceof AuthError && error.key === "tooManyRequests" && error.retryAfter) {
        retry.start(error.retryAfter);
      }
    },
  });

  const failure = signIn.isError ? errorText(signIn.error, retry.seconds) : null;

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => signIn.mutate(values))} className="flex flex-col">
      <div className="flex flex-col gap-4">
        <TextField
          type="email"
          label={common.email}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          errorMessage={fieldError(errors.email?.message)}
          {...form.register("email")}
        />
        <PasswordInput
          label={common.password}
          autoComplete="current-password"
          visibilityLabels={{ show: `${common.showPassword}`, hide: `${common.hidePassword}` }}
          errorMessage={fieldError(errors.password?.message)}
          {...form.register("password")}
        />
      </div>

      <Button asChild variant="ghostMedium" className="mt-5 self-start">
        <Link href={`/${locale}/forgot-password`}>{auth.forgotPassword}</Link>
      </Button>

      {failure && <FormAlert className="mt-5">{failure}</FormAlert>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        alignment="center"
        textSize="base"
        isLoading={signIn.isPending || signIn.isSuccess}
        disabled={retry.seconds > 0}
        className="mt-6 h-[3.125rem] w-full hover:bg-primary-300"
      >
        {auth.loginSubmit}
      </Button>

      <LegalLinks className="mt-11" />
    </form>
  );
}
