"use client";

import { signIn } from "./actions";
import { AuthForm } from "./auth-form";

export function SignInForm({ nextPath }: { nextPath: string }) {
  return (
    <AuthForm
      nextPath={nextPath}
      action={signIn}
      passwordAutoComplete="current-password"
      submitLabel="Se connecter"
      pendingLabel="Connexion…"
    />
  );
}
