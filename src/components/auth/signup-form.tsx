"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { type SignupValues, signupSchema, type ValidationKey } from "@/lib/schemas";
import { useAuthErrorText, useRetryWindow } from "@/lib/use-auth-error";

export function SignupForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const auth = useIntlayer("auth");
  const common = useIntlayer("common");
  const validation = useIntlayer("validation");
  const errorText = useAuthErrorText();
  const retry = useRetryWindow();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const fieldError = (key?: string) => (key ? `${validation[key as ValidationKey]}` : undefined);
  const visibilityLabels = { show: `${common.showPassword}`, hide: `${common.hidePassword}` };

  const signUp = useMutation({
    mutationFn: ({ email, password }: SignupValues) => authApi.signUp(email, password),
    // Signing up signs the user in.
    onSuccess: () => router.replace(`/${locale}/account`),
    onError: (error) => {
      if (error instanceof AuthError && error.key === "tooManyRequests" && error.retryAfter) {
        retry.start(error.retryAfter);
      }
    },
  });

  // An address that is already taken belongs to the email field; everything else is about the whole form.
  const emailTaken = signUp.error instanceof AuthError && signUp.error.key === "userExists";
  const failure = signUp.isError && !emailTaken ? errorText(signUp.error, retry.seconds) : null;
  const emailError = fieldError(errors.email?.message) ?? (emailTaken ? errorText(signUp.error) ?? undefined : undefined);

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => signUp.mutate(values))} className="flex flex-col">
      <div className="flex flex-col gap-4">
        <TextField
          type="email"
          label={common.email}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          errorMessage={emailError}
          {...form.register("email")}
        />
        <PasswordInput
          label={common.password}
          autoComplete="new-password"
          visibilityLabels={visibilityLabels}
          errorMessage={fieldError(errors.password?.message)}
          {...form.register("password")}
        />
        <PasswordInput
          label={common.confirmPassword}
          autoComplete="new-password"
          visibilityLabels={visibilityLabels}
          errorMessage={fieldError(errors.confirmPassword?.message)}
          {...form.register("confirmPassword")}
        />
      </div>

      {failure && <FormAlert className="mt-5">{failure}</FormAlert>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        alignment="center"
        textSize="base"
        isLoading={signUp.isPending || signUp.isSuccess}
        disabled={retry.seconds > 0}
        className="mt-6 h-[3.125rem] w-full hover:bg-primary-300"
      >
        {auth.signupSubmit}
      </Button>

      <LegalLinks className="mt-11" />
    </form>
  );
}
