import { type Dictionary, t } from "intlayer";

// Second step of the sign-in. The screen adapts to the methods the account has.
const verifyContent = {
  key: "verify",
  content: {
    metaTitle: t({ fr: "Vérification en deux étapes – Stolos", en: "Two-step verification – Stolos" }),
    title: t({ fr: "Confirmez votre identité", en: "Confirm your identity" }),
    recoveryTitle: t({ fr: "Saisissez un code de récupération", en: "Enter a recovery code" }),

    codeGroupLabel: t({ fr: "Code de vérification à six chiffres", en: "Six-digit verification code" }),
    digit: t({ fr: "Chiffre", en: "Digit" }),

    // One explanation per combination of methods, as in the design.
    helpApp: t({
      fr: "Saisissez le code à six chiffres affiché dans votre application d’authentification.",
      en: "Enter the six-digit code shown in your authenticator app.",
    }),
    helpAppAndEmail: t({
      fr: "Saisissez le code à six chiffres envoyé à l’adresse courriel de votre compte, ou le code affiché dans votre application d’authentification.",
      en: "Enter the six-digit code sent to your account’s email address, or the code shown in your authenticator app.",
    }),
    helpEmail: t({
      fr: "Saisissez le code à six chiffres envoyé à l’adresse courriel de votre compte. S’il expire, demandez un nouveau code.",
      en: "Enter the six-digit code sent to your account’s email address. If it expires, request a new code.",
    }),
    helpRecovery: t({
      fr: "Utilisez l’un des codes de récupération sauvegardés lors de l’activation de la vérification en deux étapes. Chaque code est à usage unique.",
      en: "Use one of the recovery codes you saved when you turned on two-step verification. Each code can only be used once.",
    }),

    useRecovery: t({ fr: "Utiliser un code de récupération", en: "Use a recovery code" }),
    useCode: t({ fr: "Utiliser un code de vérification", en: "Use a verification code" }),
    sendByEmail: t({ fr: "Envoyer un code par courriel", en: "Send a code by email" }),
    resend: t({ fr: "Renvoyer un code", en: "Resend code" }),

    emailSent: t({ fr: "Un code vient d’être envoyé par courriel.", en: "A code has just been sent by email." }),
    verifying: t({ fr: "Vérification en cours…", en: "Verifying…" }),

    recoveryLabel: t({ fr: "Code de récupération", en: "Recovery code" }),
    recoverySubmit: t({ fr: "Valider et se connecter", en: "Verify and sign in" }),
  },
} satisfies Dictionary;

export default verifyContent;
