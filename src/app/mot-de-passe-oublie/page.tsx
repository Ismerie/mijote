import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié · Mijote" };

export default async function MotDePasseOubliePage({ searchParams }: PageProps<"/mot-de-passe-oublie">) {
  const linkInvalid = (await searchParams).lien === "invalide";

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FFF6EC] px-6 py-12 text-[#7A3219]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-balance text-center text-[#7A3219]/80">
          Indique l&apos;email de ton compte : on t&apos;envoie un lien pour en choisir un nouveau.
        </p>
        {linkInvalid && (
          <p role="alert" className="text-center text-sm text-red-700">
            Ce lien n&apos;est plus valable. Demande-en un nouveau, en utilisant le même appareil.
          </p>
        )}
        <ForgotPasswordForm />
        <Link href="/connexion" className="text-sm underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
