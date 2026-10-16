import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/auth-screen";
import { NEXT_PARAM, safeNextPath } from "@/features/auth/next-path";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Inscription · Mijote" };

export default async function InscriptionPage({ searchParams }: PageProps<"/inscription">) {
  const nextPath = safeNextPath((await searchParams)[NEXT_PARAM]);

  return (
    <AuthScreen
      nextPath={nextPath}
      title="Créer un compte"
      switchText="Déjà un compte ?"
      switchHref="/connexion"
      switchLabel="Se connecter"
    >
      <SignUpForm nextPath={nextPath} />
    </AuthScreen>
  );
}
