import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/features/auth/current-user";
import { SignOutButton } from "@/features/auth/sign-out-button";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#FFF6EC] px-6 text-center">
      <Image
        src="/icons/icon.svg"
        alt=""
        width={96}
        height={96}
        className="rounded-3xl shadow-sm"
        priority
      />
      <h1 className="text-4xl font-semibold tracking-tight text-[#7A3219]">
        Mijote
      </h1>
      {user ? (
        <>
          <p className="max-w-xs text-balance text-[#7A3219]/80">
            Connectée en tant que {user.email}.
          </p>
          <SignOutButton />
        </>
      ) : (
        <>
          <p className="max-w-xs text-balance text-[#7A3219]/80">
            L&apos;encyclopédie de plats, le planning et la liste de courses du
            foyer.
          </p>
          <Link
            href="/connexion"
            className="font-medium text-[#C2552D] underline underline-offset-4"
          >
            Se connecter
          </Link>
        </>
      )}
    </main>
  );
}
