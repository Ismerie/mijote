import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/features/auth/sign-out-button";
import { CreateHouseholdForm } from "@/features/household/components/create-household-form";
import { getCurrentHousehold } from "@/features/household/current-household";

export const metadata: Metadata = { title: "Bienvenue · Mijote" };

// Première connexion sans foyer : on propose d'en créer un (#7).
export default async function BienvenuePage() {
  if (await getCurrentHousehold()) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FFF6EC] px-6 py-12 text-[#7A3219]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Image src="/icons/icon.svg" alt="" width={64} height={64} className="rounded-2xl shadow-sm" priority />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenue sur Mijote</h1>
          <p className="text-balance text-[#7A3219]/80">
            Crée ton foyer pour y ranger vos plats et organiser vos repas.
          </p>
        </div>
        <CreateHouseholdForm />
        {/* Pour changer de compte si on s'est trompée. */}
        <SignOutButton />
      </div>
    </main>
  );
}
