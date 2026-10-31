"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Input } from "@/components/ui/input";

import { AISLES } from "../aisles";
import { describePurchase } from "../format";
import type { IngredientWithUsage } from "../queries";
import { normalizeName } from "../search";

function usageLabel(count: number): string {
  if (count === 0) return "aucun plat";
  return `${count} plat${count > 1 ? "s" : ""}`;
}

// Catalogue d'ingrédients groupé par rayon, avec une recherche par nom (#26).
export function IngredientList({ ingredients }: { ingredients: IngredientWithUsage[] }) {
  const [search, setSearch] = useState("");
  const query = normalizeName(search);
  const visible = query ? ingredients.filter((i) => normalizeName(i.name).includes(query)) : ingredients;

  const groups = AISLES.map((aisle) => ({
    ...aisle,
    items: visible.filter((i) => i.aisle === aisle.value).sort((a, b) => a.name.localeCompare(b.name, "fr")),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="ings-search" className="sr-only">
        Chercher un ingrédient
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="ings-search"
          type="search"
          placeholder="Chercher un ingrédient"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-xl bg-card pl-10 text-base"
        />
      </div>

      {groups.map((group) => (
        <section key={group.value} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{group.label}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {group.items.map((ingredient) => (
              <li key={ingredient.id}>
                <Link
                  href={`/plats/ingredients/${ingredient.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{ingredient.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {describePurchase(ingredient)} · {usageLabel(ingredient.dishNames.length)}
                    </span>
                  </span>
                  {ingredient.alwaysInStock && (
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      En stock
                    </span>
                  )}
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {ingredients.length > 0 && groups.length === 0 && (
        <p className="my-4 text-center text-muted-foreground">Aucun ingrédient ne correspond.</p>
      )}
      {ingredients.length === 0 && (
        <p className="my-4 text-center text-muted-foreground">Pas encore d&apos;ingrédient dans ton foyer.</p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Tu peux aussi en créer en écrivant la recette d&apos;un plat.
      </p>
    </div>
  );
}
