import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // /fr and /en have no page of their own: the entry point of the app is the login screen.
  async redirects() {
    return [{ source: "/:locale(fr|en)", destination: "/:locale/login", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withIntlayer(nextConfig);
