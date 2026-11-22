import { type Dictionary, t } from "intlayer";

// Form validation messages. Keys match `ValidationKey` in src/lib/schemas.ts.
const validationContent = {
  key: "validation",
  content: {
    emailRequired: t({ fr: "Saisissez votre adresse courriel.", en: "Enter your email address." }),
    emailInvalid: t({ fr: "Saisissez une adresse courriel valide.", en: "Enter a valid email address." }),
    passwordRequired: t({ fr: "Saisissez votre mot de passe.", en: "Enter your password." }),
    passwordTooShort: t({
      fr: "Le mot de passe doit contenir au moins 8 caractères.",
      en: "The password must be at least 8 characters long.",
    }),
    confirmRequired: t({ fr: "Confirmez votre mot de passe.", en: "Confirm your password." }),
    passwordMismatch: t({ fr: "Les mots de passe ne correspondent pas.", en: "The passwords don’t match." }),
    recoveryCodeRequired: t({ fr: "Saisissez un code de récupération.", en: "Enter a recovery code." }),
  },
} satisfies Dictionary;

export default validationContent;
