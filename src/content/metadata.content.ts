import { type Dictionary, t } from "intlayer";
import type { Metadata } from "next";

const metadataContent = {
  key: "metadata",
  content: {
    title: t({ fr: "Stolos", en: "Stolos" }),
    description: t({
      fr: "Connectez-vous à Stolos pour retrouver vos flottes d'entreprises.",
      en: "Sign in to Stolos to get back to your company fleets.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default metadataContent;
