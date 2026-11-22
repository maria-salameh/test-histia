import { type Dictionary, t } from "intlayer";

// What the user reads when the server refuses something. One entry per `AuthErrorKey` (src/lib/auth-errors.ts).
const errorsContent = {
  key: "errors",
  content: {
    invalidCredentials: t({
      fr: "Adresse courriel ou mot de passe incorrect.",
      en: "Incorrect email address or password.",
    }),
    userExists: t({
      fr: "Un compte existe déjà avec cette adresse courriel.",
      en: "An account already exists with this email address.",
    }),
    invalidCode: t({ fr: "Code invalide ou expiré.", en: "Invalid or expired code." }),
    invalidBackupCode: t({
      fr: "Code de récupération invalide ou déjà utilisé.",
      en: "Invalid or already used recovery code.",
    }),
    tooManyCodeAttempts: t({
      fr: "Trop de tentatives. Demandez un nouveau code.",
      en: "Too many attempts. Request a new code.",
    }),
    attemptExpired: t({
      fr: "Votre tentative de connexion a expiré. Veuillez vous reconnecter.",
      en: "Your sign-in attempt has expired. Please sign in again.",
    }),
    invalidToken: t({
      fr: "Ce lien est invalide, a expiré ou a déjà été utilisé.",
      en: "This link is invalid, has expired or has already been used.",
    }),
    tooManyRequests: t({
      fr: "Trop de tentatives. Veuillez patienter avant de réessayer.",
      en: "Too many attempts. Please wait before trying again.",
    }),
    // Same message with the delay the server asked for (the X-Retry-After header).
    tooManyRequestsIn: t({ fr: "Trop de tentatives. Réessayez dans", en: "Too many attempts. Try again in" }),
    seconds: t({ fr: "s", en: "s" }),
    network: t({
      fr: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
      en: "Couldn’t reach the server. Check your connection and try again.",
    }),
    generic: t({
      fr: "Une erreur est survenue. Veuillez réessayer.",
      en: "Something went wrong. Please try again.",
    }),
  },
} satisfies Dictionary;

export default errorsContent;
