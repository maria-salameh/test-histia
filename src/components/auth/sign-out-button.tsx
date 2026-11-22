"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth-api";

export function SignOutButton() {
  const { locale } = useLocale();
  const router = useRouter();
  const account = useIntlayer("account");
  // Busy until the login page is on screen. Not tied to the mutation's "success": Next keeps this page alive in
  // the background, and the next sign-in would find the button still busy.
  const [isNavigating, startNavigation] = useTransition();

  const signOut = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => startNavigation(() => router.replace(`/${locale}/login`)),
  });

  return (
    <Button
      variant="primary"
      size="lg"
      alignment="center"
      textSize="base"
      isLoading={signOut.isPending || isNavigating}
      onClick={() => signOut.mutate()}
      className="h-[3.125rem] w-full max-w-[30rem] hover:bg-primary-300"
    >
      {account.signOut}
    </Button>
  );
}
