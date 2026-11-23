import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams } from "next-intlayer";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginCard } from "@/components/auth/login-card";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("auth", locale).metaTitle };
};

// A Server Component: the shell (background, logo, fleet cards) around the one client component that holds the forms.
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginCard />
    </AuthShell>
  );
}
