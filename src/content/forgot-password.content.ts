import { type Dictionary, t } from "intlayer";

const forgotPasswordContent = {
  key: "forgot-password",
  content: {
    metaTitle: t({ fr: "Mot de passe oublié – Stolos", en: "Forgot password – Stolos" }),
    title: t({ fr: "Mot de passe oublié ?", en: "Forgot your password?" }),
    description: t({
      fr: "Saisissez l’adresse courriel de votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.",
      en: "Enter your account’s email address. We’ll send you a link to reset your password.",
    }),
    submit: t({ fr: "Envoyer le lien", en: "Send link" }),

    sentTitle: t({ fr: "Vérifiez votre boîte courriel", en: "Check your inbox" }),
    sentDescription: t({
      fr: "Si un compte est associé à cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe. Pensez à vérifier vos courriers indésirables.",
      en: "If an account is linked to this address, you’ll receive a link to reset your password. Remember to check your spam folder.",
    }),
    resend: t({ fr: "Renvoyer le lien", en: "Resend link" }),
    resent: t({ fr: "Un nouveau lien vient d’être envoyé.", en: "A new link has just been sent." }),
  },
} satisfies Dictionary;

export default forgotPasswordContent;
