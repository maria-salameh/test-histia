import { getIntlayer } from "intlayer";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { connection } from "next/server";
import type { LocalPromiseParams } from "next-intlayer";
import { Suspense } from "react";
import { ResetPasswordEmail } from "@/components/email/reset-password-email";
import { prisma } from "@/lib/prisma";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  return { title: getIntlayer("reset-email", locale).metaTitle };
};

export default function EmailPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-[#3a3a40] px-4 py-10">
      <Suspense fallback={null}>
        <LatestResetEmail />
      </Suspense>
    </main>
  );
}

/**
 * No mail is really sent: the app stores the latest reset link (it is also listed on /code). This page shows the
 * email that link would be sent in. Until someone asks for a link, it shows the design with a sample link.
 *
 * DEVELOPMENT ONLY, like /code: it shows the latest reset link of ANY account to any visitor. In production the
 * email goes through a mail provider and this route should disappear (or sit behind a development flag).
 */
async function LatestResetEmail() {
  // Reading the database at request time: `connection()` tells Next this part cannot be prerendered, and it
  // sits inside <Suspense> as Cache Components requires.
  await connection();
  // `locale` is a root parameter of the localized layout only, so its type allows "none" (as on /code).
  const locale = (await rootLocale()) ?? "fr";

  const mail = await prisma.devMail.findFirst({
    where: { kind: "PASSWORD_RESET" },
    orderBy: { createdAt: "desc" }, // the index on (to, kind, createdAt) serves this query
  });
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const url = mail?.content ?? `${baseUrl}/${locale}/reset-password?token=preview`;

  return <ResetPasswordEmail locale={locale} url={url} />;
}
