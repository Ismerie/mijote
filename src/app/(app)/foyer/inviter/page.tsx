import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentHousehold } from "@/features/household/current-household";
import { InviteLink } from "@/features/invitation/invite-link";

export const metadata: Metadata = { title: "Inviter · Mijote" };

export default async function InviterPage() {
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Inviter quelqu&apos;un</h1>
          <p className="text-balance text-foreground/80">
            Envoie ce lien à la personne que tu veux faire entrer dans le foyer « {household.name} ».
          </p>
        </div>
        <InviteLink />
        <Link href="/" className="text-sm underline underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
