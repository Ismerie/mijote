import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/features/auth/sign-out-button";
import { getCurrentHousehold } from "@/features/household/current-household";

export default async function Home() {
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Image
        src="/icons/icon.svg"
        alt=""
        width={96}
        height={96}
        className="rounded-3xl shadow-sm"
        priority
      />
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Mijote
      </h1>
      <p className="max-w-xs text-balance text-foreground/80">
        Bonjour {household.firstName}, bienvenue dans le foyer « {household.name} ».
      </p>
      <Link href="/foyer" className="font-medium text-primary underline underline-offset-4">
        Mon foyer
      </Link>
      <SignOutButton />
    </main>
  );
}
