import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

// /code is the helper page provided with the exercise: it lives outside the localized tree,
// so it gets its own root layout.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = { title: "/code" };

export default function CodeLayout({ children }: LayoutProps<"/code">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
