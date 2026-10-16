"use client";

import { signUp } from "./actions";
import { AuthForm } from "./auth-form";

export function SignUpForm({ nextPath }: { nextPath: string }) {
  return (
    <AuthForm
      nextPath={nextPath}
      action={signUp}
      passwordAutoComplete="new-password"
      submitLabel="Créer mon compte"
      pendingLabel="Création…"
    />
  );
}
