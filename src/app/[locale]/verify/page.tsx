import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams } from "next-intlayer";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyCard } from "@/components/auth/verify-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("verify", locale).metaTitle };
};

// Server shell + the client VerifyCard: the card reads localStorage (which methods the account has), so it
// cannot be rendered on the server.
export default function VerifyPage() {
  return (
    <AuthShell>
      <VerifyCard />
    </AuthShell>
  );
}
