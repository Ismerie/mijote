import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";

// Toutes les pages de l'app demandent un foyer : sans foyer, direction la création (#7).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const household = await getCurrentHousehold();
  if (!household) redirect("/bienvenue");

  return children;
}
