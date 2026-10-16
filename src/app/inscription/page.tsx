import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/auth-screen";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Inscription · Mijote" };

export default function InscriptionPage() {
  return (
    <AuthScreen
      title="Créer un compte"
      switchText="Déjà un compte ?"
      switchHref="/connexion"
      switchLabel="Se connecter"
    >
      <SignUpForm />
    </AuthScreen>
  );
}
