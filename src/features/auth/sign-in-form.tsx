"use client";

import { signIn } from "./actions";
import { AuthForm } from "./auth-form";

export function SignInForm() {
  return (
    <AuthForm
      action={signIn}
      passwordAutoComplete="current-password"
      submitLabel="Se connecter"
      pendingLabel="Connexion…"
    />
  );
}
