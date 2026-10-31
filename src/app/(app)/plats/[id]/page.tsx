import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DishDetails } from "@/features/dish/components/dish-details";
import { getDish } from "@/features/dish/queries";
import { getCurrentHousehold } from "@/features/household/current-household";

export async function generateMetadata({ params }: PageProps<"/plats/[id]">): Promise<Metadata> {
  const { id } = await params;
  const household = await getCurrentHousehold();
  const dish = household ? await getDish(household.id, id) : null;
  return { title: `${dish?.name ?? "Plat"} · Mijote` };
}

export default async function PlatPage({ params }: PageProps<"/plats/[id]">) {
  const { id } = await params;
  const household = (await getCurrentHousehold())!;
  const dish = await getDish(household.id, id);
  if (!dish) notFound();

  return <DishDetails dish={dish} />;
}
