import { type Dictionary, t } from "intlayer";

// The password-reset email, as designed. Shown at /email.
const resetEmailContent = {
  key: "reset-email",
  content: {
    metaTitle: t({ fr: "Courriel de réinitialisation – Stolos", en: "Reset email – Stolos" }),
    brand: t({ fr: "Stolos", en: "Stolos" }),
    title: t({ fr: "Réinitialisez votre mot de passe", en: "Reset your password" }),
    action: t({ fr: "Choisir un nouveau mot de passe", en: "Choose a new password" }),
    body: t({
      fr: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Stolos. Ce lien expire dans une heure.",
      en: "We received a request to reset the password of your Stolos account. This link expires in one hour.",
    }),
    ignore: t({
      fr: "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message : votre mot de passe reste inchangé.",
      en: "If you didn’t make this request, you can ignore this message: your password stays unchanged.",
    }),
    copyLink: t({ fr: "Ou copiez ce lien dans votre navigateur :", en: "Or copy this link into your browser:" }),
    footerBefore: t({ fr: "Ceci est un message automatique de", en: "This is an automated message from" }),
    footerAfter: t({ fr: "Merci de ne pas y répondre.", en: "Please do not reply." }),
  },
} satisfies Dictionary;

export default resetEmailContent;
