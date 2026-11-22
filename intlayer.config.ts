import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.FRENCH, Locales.ENGLISH],
    defaultLocale: Locales.FRENCH,
  },
  routing: {
    // /login redirects to /fr/login or /en/login; the language lives in the URL, so no language switcher.
    mode: "prefix-all",
  },
};

export default config;
