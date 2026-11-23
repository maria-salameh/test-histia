import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";

const nextConfig: NextConfig = {
  // Cache Components (provided): pages are prerendered as a static shell, and anything that needs the request
  // (cookies, headers, the database) has to sit behind <Suspense> and streams in.
  cacheComponents: true,
  // Provided: prefetch the static part of linked pages, even when their dynamic part is not cacheable.
  partialPrefetching: true,
  // /fr and /en have no page of their own: the entry point of the app is the login screen.
  async redirects() {
    return [{ source: "/:locale(fr|en)", destination: "/:locale/login", permanent: false }];
  },
  // Provided: tells Turbopack to run every .css file through Tailwind v4's loader.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Intlayer builds the dictionaries (src/content/*.content.ts) before the app starts and adds its own bundler
// settings on top of ours.
export default withIntlayer(nextConfig);
