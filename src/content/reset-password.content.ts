import { type Dictionary, t } from "intlayer";

const resetPasswordContent = {
  key: "reset-password",
  content: {
    metaTitle: t({ fr: "Nouveau mot de passe – Stolos", en: "New password – Stolos" }),
    title: t({ fr: "Créez un nouveau mot de passe", en: "Create a new password" }),
    description: t({
      fr: "Choisissez un nouveau mot de passe pour votre compte.",
      en: "Choose a new password for your account.",
    }),
    newPassword: t({ fr: "Nouveau mot de passe", en: "New password" }),
    confirmPassword: t({ fr: "Confirmez le mot de passe", en: "Confirm password" }),
    submit: t({ fr: "Enregistrer le mot de passe", en: "Save password" }),

    // Not in the design: the two ways this page can end.
    successTitle: t({ fr: "Mot de passe mis à jour", en: "Password updated" }),
    successDescription: t({
      fr: "Votre mot de passe a bien été modifié. Vous pouvez maintenant vous connecter.",
      en: "Your password has been changed. You can now sign in.",
    }),
    successAction: t({ fr: "Se connecter", en: "Sign in" }),

    invalidTitle: t({ fr: "Lien invalide ou expiré", en: "Invalid or expired link" }),
    invalidDescription: t({
      fr: "Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé. Demandez-en un nouveau pour continuer.",
      en: "This reset link is invalid, has expired or has already been used. Request a new one to continue.",
    }),
    invalidAction: t({ fr: "Demander un nouveau lien", en: "Request a new link" }),
  },
} satisfies Dictionary;

export default resetPasswordContent;
