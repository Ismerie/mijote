"use client";

import { signUp } from "./actions";
import { AuthForm } from "./auth-form";

export function SignUpForm() {
  return (
    <AuthForm
      action={signUp}
      passwordAutoComplete="new-password"
      submitLabel="Créer mon compte"
      pendingLabel="Création…"
    />
  );
}
