import { type Dictionary, t } from "intlayer";

// The page shown once signed in: any page is enough, as long as it clearly says the user is connected.
const accountContent = {
  key: "account",
  content: {
    metaTitle: t({ fr: "Mon compte – Stolos", en: "My account – Stolos" }),
    title: t({ fr: "Vous êtes connecté", en: "You are signed in" }),
    description: t({ fr: "Bienvenue sur Stolos.", en: "Welcome to Stolos." }),
    signedInAs: t({ fr: "Connecté en tant que", en: "Signed in as" }),
    signOut: t({ fr: "Se déconnecter", en: "Sign out" }),
  },
} satisfies Dictionary;

export default accountContent;
