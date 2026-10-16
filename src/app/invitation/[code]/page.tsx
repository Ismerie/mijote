import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getCurrentHousehold } from "@/features/household/current-household";
import { AcceptInvitationForm } from "@/features/invitation/accept-invitation-form";
import { getInvitation } from "@/features/invitation/get-invitation";

export const metadata: Metadata = { title: "Invitation · Mijote" };

// Lien d'invitation (#8). Hors du groupe (app) : une personne invitée n'a pas encore de foyer.
// Pas connectée, le proxy l'envoie d'abord vers la connexion, puis la ramène ici.
export default async function InvitationPage({ params }: PageProps<"/invitation/[code]">) {
  const { code } = await params;
  const [household, invitation] = await Promise.all([getCurrentHousehold(), getInvitation(code)]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FFF6EC] px-6 py-12 text-[#7A3219]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Image src="/icons/icon.svg" alt="" width={64} height={64} className="rounded-2xl shadow-sm" priority />
        {household ? (
          <Message title="Tu as déjà un foyer">
            Tu fais déjà partie du foyer « {household.name} ». Un compte ne peut appartenir qu&apos;à un seul
            foyer.
          </Message>
        ) : !invitation ? (
          <Message title="Invitation introuvable">
            Ce lien d&apos;invitation n&apos;existe pas. Vérifie qu&apos;il est complet, ou demande un nouveau lien.
          </Message>
        ) : invitation.status === "used" ? (
          <Message title="Invitation déjà utilisée">
            Ce lien a déjà servi : chaque lien ne fonctionne qu&apos;une fois. Demande un nouveau lien à un membre
            du foyer « {invitation.householdName} ».
          </Message>
        ) : invitation.status === "expired" ? (
          <Message title="Invitation expirée">
            Ce lien n&apos;est plus valable : il expire au bout de 7 jours. Demande un nouveau lien à un membre du
            foyer « {invitation.householdName} ».
          </Message>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Rejoindre « {invitation.householdName} »
              </h1>
              <p className="text-balance text-[#7A3219]/80">
                Tu as été invité·e dans ce foyer pour partager ses plats, son planning et sa liste de courses.
              </p>
            </div>
            <div className="w-full text-left">
              <AcceptInvitationForm code={code} />
            </div>
          </>
        )}
        {(household || !invitation || invitation.status !== "valid") && (
          <Link href="/" className="text-sm underline underline-offset-4">
            Aller à l&apos;accueil
          </Link>
        )}
      </div>
    </main>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-balance text-[#7A3219]/80">{children}</p>
    </div>
  );
}
