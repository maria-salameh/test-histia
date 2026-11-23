import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams } from "next-intlayer";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("forgot-password", locale).metaTitle };
};

// Server shell + the client form. The routes are free (the brief says so): /forgot-password, then /forgot-password/sent.
export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordCard />
    </AuthShell>
  );
}
