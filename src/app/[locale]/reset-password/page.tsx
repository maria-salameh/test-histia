import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import type { LocalPromiseParams } from "next-intlayer";
import { Suspense } from "react";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordCard } from "@/components/auth/reset-password-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("reset-password", locale).metaTitle };
};

export default async function ResetPasswordPage() {
  const content = getIntlayer("reset-password", await rootLocale());

  return (
    <AuthShell>
      {/* The card reads the token from the URL, which is only known once the request is. */}
      <Suspense
        fallback={
          <AuthCard aria-busy="true">
            <AuthCardHeader title={content.title} />
          </AuthCard>
        }
      >
        <ResetPasswordCard />
      </Suspense>
    </AuthShell>
  );
}
