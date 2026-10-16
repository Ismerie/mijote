import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/auth-screen";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion · Mijote" };

export default function ConnexionPage() {
  return (
    <AuthScreen
      title="Se connecter"
      switchText="Pas encore de compte ?"
      switchHref="/inscription"
      switchLabel="Créer un compte"
    >
      <SignInForm />
    </AuthScreen>
  );
}
