import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams } from "next-intlayer";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordSentCard } from "@/components/auth/forgot-password-sent-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("forgot-password", locale).metaTitle };
};

export default function ForgotPasswordSentPage() {
  return (
    <AuthShell>
      <ForgotPasswordSentCard />
    </AuthShell>
  );
}
