import { getHTMLTextDir, getIntlayer } from "intlayer";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { LocalPromiseParams, NextLayoutIntlayer } from "next-intlayer";
import { IntlayerProvider } from "next-intlayer/server";
import { Providers } from "@/components/providers";
import "../globals.css";

// One page per locale, built ahead of time: /fr/* and /en/*.
export { generateStaticParams } from "next-intlayer";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer("metadata", locale);
  return { title, description };
};

// Root layout of every localized page. The `[locale]` segment is the single source of truth for the language.
const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params;

  return (
    <html lang={locale} dir={getHTMLTextDir(locale)} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <IntlayerProvider locale={locale}>
          <Providers>{children}</Providers>
        </IntlayerProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
