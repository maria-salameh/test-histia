import { type Dictionary, t } from "intlayer";

// An Intlayer dictionary. `key` is what components pass to useIntlayer("common"); each text is t({ fr, en }).
// The keys are typed, so a typo or a missing translation is a compile-time error. Same pattern in every
// *.content.ts file next to this one.
const commonContent = {
  key: "common",
  content: {
    logoAlt: t({ fr: "Logo Stolos", en: "Stolos logo" }),
    email: t({ fr: "Adresse courriel", en: "Email address" }),
    password: t({ fr: "Mot de passe", en: "Password" }),
    confirmPassword: t({ fr: "Confirmez le mot de passe", en: "Confirm password" }),
    showPassword: t({ fr: "Afficher le mot de passe", en: "Show password" }),
    hidePassword: t({ fr: "Masquer le mot de passe", en: "Hide password" }),
    backToLogin: t({ fr: "Retour à la connexion", en: "Back to sign in" }),
    terms: t({ fr: "Conditions d'utilisation", en: "Terms of use" }),
    privacy: t({ fr: "Politique de confidentialité", en: "Privacy policy" }),
    legalLinks: t({ fr: "Informations légales", en: "Legal information" }),
    loading: t({ fr: "Chargement…", en: "Loading…" }),
  },
} satisfies Dictionary;

export default commonContent;
