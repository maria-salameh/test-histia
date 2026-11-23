import { getHTMLTextDir, getIntlayer } from "intlayer";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { LocalPromiseParams, NextLayoutIntlayer } from "next-intlayer";
import { IntlayerProvider } from "next-intlayer/server";
import { Providers } from "@/components/providers";
import "../globals.css";

// One page per locale, built ahead of time: /fr/* and /en/*. With Cache Components Next requires at least one
// value for every root parameter (here `locale`), and this gives it one per configured language.
export { generateStaticParams } from "next-intlayer";

// next/font downloads Inter at build time and serves it from our own origin (no request to Google at runtime).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Page title and description in the language of the URL. `getIntlayer` (not the `useIntlayer` hook) because this
// is not a component.
export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer("metadata", locale);
  return { title, description };
};

// Root layout of every localized page. It lives inside `[locale]` (instead of app/layout.tsx) so that `<html lang>`
// and `dir` follow the URL. The provided /code page sits outside and has its own root layout.
const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params;

  return (
    <html lang={locale} dir={getHTMLTextDir(locale)} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Makes the language available to server and client components below (useIntlayer / getIntlayer). */}
        <IntlayerProvider locale={locale}>
          {/* TanStack Query: a client component, so it wraps the children without making them client-only. */}
          <Providers>{children}</Providers>
        </IntlayerProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
