import Image from "next/image";
import Link from "next/link";

import { withNext } from "./next-path";

type Props = {
  title: string;
  children: React.ReactNode;
  switchText: string;
  switchHref: "/connexion" | "/inscription";
  switchLabel: string;
  nextPath: string;
};

// Mise en page commune des écrans de connexion et d'inscription.
export function AuthScreen({ title, children, switchText, switchHref, switchLabel, nextPath }: Props) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FFF6EC] px-6 py-12 text-[#7A3219]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Image src="/icons/icon.svg" alt="" width={64} height={64} className="rounded-2xl shadow-sm" priority />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
        <p className="text-sm">
          {switchText}{" "}
          <Link href={withNext(switchHref, nextPath)} className="font-medium underline underline-offset-4">
            {switchLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
