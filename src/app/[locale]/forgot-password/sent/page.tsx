import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams } from "next-intlayer";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordSentCard } from "@/components/auth/forgot-password-sent-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("forgot-password", locale).metaTitle };
};

// A route of its own (not a state of the form) so that "check your inbox" and its resend countdown survive a reload.
export default function ForgotPasswordSentPage() {
  return (
    <AuthShell>
      <ForgotPasswordSentCard />
    </AuthShell>
  );
}
