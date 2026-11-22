"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth-api";

export function SignOutButton() {
  const { locale } = useLocale();
  const router = useRouter();
  const account = useIntlayer("account");

  const signOut = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => router.replace(`/${locale}/login`),
  });

  return (
    <Button
      variant="primary"
      size="lg"
      alignment="center"
      textSize="base"
      isLoading={signOut.isPending || signOut.isSuccess}
      onClick={() => signOut.mutate()}
      className="h-[3.125rem] w-full max-w-[30rem] hover:bg-primary-300"
    >
      {account.signOut}
    </Button>
  );
}
