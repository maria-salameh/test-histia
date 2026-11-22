import { type Dictionary, t } from "intlayer";

// Login / sign-up card: one card, two tabs.
const authContent = {
  key: "auth",
  content: {
    metaTitle: t({ fr: "Connexion – Stolos", en: "Sign in – Stolos" }),
    tabsLabel: t({ fr: "Connexion ou inscription", en: "Sign in or sign up" }),
    tabLogin: t({ fr: "Connexion", en: "Sign in" }),
    tabSignup: t({ fr: "Inscription", en: "Sign up" }),

    loginTitle: t({ fr: "Ravi de vous revoir sur Stolos !", en: "Welcome back to Stolos!" }),
    loginSubtitle: t({ fr: "Connectez-vous à votre compte", en: "Sign in to your account" }),
    loginSubmit: t({ fr: "Se connecter", en: "Sign in" }),
    forgotPassword: t({ fr: "Mot de passe oublié ?", en: "Forgot password?" }),

    signupTitle: t({ fr: "Bienvenue sur Stolos !", en: "Welcome to Stolos!" }),
    signupSubtitle: t({ fr: "Créez votre compte", en: "Create your account" }),
    signupSubmit: t({ fr: "Créer mon compte", en: "Create my account" }),
  },
} satisfies Dictionary;

export default authContent;
