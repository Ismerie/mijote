import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/features/auth/current-user";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getCurrentHousehold } from "@/features/household/current-household";
import { getHouseholdMembers } from "@/features/household/household-members";
import { MenuSettings } from "@/features/household/components/menu-settings";
import { PeopleCountStepper } from "@/features/household/components/people-count-stepper";

export const metadata: Metadata = { title: "Mon foyer · Mijote" };

export default async function FoyerPage() {
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const [user, members] = await Promise.all([getCurrentUser(), getHouseholdMembers(household.id)]);

  return (
    <main className="flex flex-1 flex-col gap-8 bg-background px-4 py-8 text-foreground">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mon foyer</h1>
        <p className="text-sm text-muted-foreground">{household.name}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Membres</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {members.map((member) => {
            const isMe = member.userId === user?.id;
            return (
              <li key={member.userId} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-secondary font-semibold text-primary"
                >
                  {member.firstName.charAt(0).toUpperCase()}
                </span>
                <span>
                  {member.firstName}
                  {isMe && <span className="text-muted-foreground"> (toi)</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <Link
          href="/foyer/inviter"
          className="flex h-11 items-center justify-center rounded-xl border border-primary font-medium text-primary"
        >
          Inviter quelqu&apos;un
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Nombre de personnes</h2>
        <PeopleCountStepper initialCount={household.peopleCount} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Organisation des menus</h2>
        <MenuSettings shoppingDay={household.shoppingDay} menuLengthDays={household.menuLengthDays} />
      </section>

      {/* L'accueil devient le menu (#28) : la déconnexion, qui y était, passe ici comme sur la maquette. */}
      <SignOutButton />
    </main>
  );
}
