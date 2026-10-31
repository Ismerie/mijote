import type { Metadata } from "next";

import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe · Mijote" };

// Accessible seulement après le lien reçu par email : le proxy redirige vers la connexion sinon.
export default function NouveauMotDePassePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FFF6EC] px-6 py-12 text-[#7A3219]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-balance text-center text-[#7A3219]/80">Choisis le mot de passe que tu utiliseras désormais.</p>
        <NewPasswordForm />
      </div>
    </main>
  );
}
