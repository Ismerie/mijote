import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/auth-screen";
import { NEXT_PARAM, safeNextPath } from "@/features/auth/next-path";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion · Mijote" };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const nextPath = safeNextPath((await searchParams)[NEXT_PARAM]);

  return (
    <AuthScreen
      nextPath={nextPath}
      title="Se connecter"
      switchText="Pas encore de compte ?"
      switchHref="/inscription"
      switchLabel="Créer un compte"
    >
      <SignInForm nextPath={nextPath} />
    </AuthScreen>
  );
}
