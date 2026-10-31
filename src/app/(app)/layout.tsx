import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { getCurrentHousehold } from "@/features/household/current-household";

// Toutes les pages de l'app demandent un foyer : sans foyer, direction la création (#7).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const household = await getCurrentHousehold();
  if (!household) redirect("/bienvenue");

  return (
    <>
      {/* Réserve la hauteur de la barre du bas pour qu'elle ne cache pas la fin des pages. */}
      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <AppNav />
    </>
  );
}
