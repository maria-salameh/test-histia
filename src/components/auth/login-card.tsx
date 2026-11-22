"use client";

import { useIntlayer } from "next-intlayer";
import { useId, useState } from "react";
import { AUTH_FORM_WIDTH, AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { AuthTabs, panelId, tabId } from "@/components/auth/auth-tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

type Mode = "login" | "signup";

/**
 * One card for both ways in. The tabs swap the title and the form without leaving the page;
 * both forms stay mounted, so what was typed is still there when going back and forth.
 */
export function LoginCard() {
  const auth = useIntlayer("auth");
  const idBase = useId();
  const [mode, setMode] = useState<Mode>("login");
  const isLogin = mode === "login";

  const tabs = [
    { id: "login", label: `${auth.tabLogin}` },
    { id: "signup", label: `${auth.tabSignup}` },
  ] as const;

  return (
    <AuthCard aria-labelledby={`${idBase}-title`}>
      <AuthCardHeader
        titleId={`${idBase}-title`}
        title={`${isLogin ? auth.loginTitle : auth.signupTitle}`}
        description={`${isLogin ? auth.loginSubtitle : auth.signupSubtitle}`}
      />

      <div className={AUTH_FORM_WIDTH}>
        <div className="mt-10">
          <AuthTabs tabs={tabs} value={mode} onChange={setMode} label={`${auth.tabsLabel}`} idBase={idBase} />
        </div>

        <div
          role="tabpanel"
          id={panelId(idBase, "login")}
          aria-labelledby={tabId(idBase, "login")}
          hidden={!isLogin}
          className="mt-6"
        >
          <LoginForm />
        </div>
        <div
          role="tabpanel"
          id={panelId(idBase, "signup")}
          aria-labelledby={tabId(idBase, "signup")}
          hidden={isLogin}
          className="mt-6"
        >
          <SignupForm />
        </div>
      </div>
    </AuthCard>
  );
}
