import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import type { LocalPromiseParams } from "next-intlayer";
import { Suspense } from "react";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSession } from "@/lib/session";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("account", locale).metaTitle };
};

// The page shell (background, logo, an empty card) is prerendered; only <Account /> waits for the request.
export default function AccountPage() {
  return (
    <AuthShell>
      {/* The session is read from the request cookies, so it streams in behind this boundary. */}
      <Suspense fallback={<AuthCard aria-busy="true" className="min-h-[22rem]" />}>
        <Account />
      </Suspense>
    </AuthShell>
  );
}

/**
 * The only page behind the login. proxy.ts already sends visitors without a session cookie away;
 * this is the real check: a cookie that no longer matches a session gets the same treatment.
 * It is an async Server Component, so it reads the session directly (no API call from the browser) and ships
 * no JavaScript of its own; only the sign-out button is a client component.
 */
async function Account() {
  const locale = await rootLocale();
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`); // throws: nothing below runs for a visitor without a session

  // getIntlayer, not useIntlayer: hooks are not allowed in an async component.
  const content = getIntlayer("account", locale);

  return (
    <AuthCard aria-labelledby="account-title">
      <div className="flex flex-col items-center gap-8 text-center">
        <span aria-hidden className="grid size-16 place-items-center rounded-full bg-success-100 text-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5 10 17.5 19 7.5" />
          </svg>
        </span>
        <AuthCardHeader titleId="account-title" title={content.title} description={content.description} />
        {/* The brief only needs a page that clearly shows who is connected. */}
        <p className="rounded-sm bg-black/20 px-4 py-3 text-sx text-white">
          {content.signedInAs} <strong className="font-semibold">{session.user.email}</strong>
        </p>
        <SignOutButton />
      </div>
    </AuthCard>
  );
}
