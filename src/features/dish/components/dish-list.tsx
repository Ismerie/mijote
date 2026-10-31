"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { normalizeName } from "@/features/ingredient/search";

import type { DishSummary } from "../dish";
import { describeDish } from "../dish-fields";

// Liste des plats avec la recherche par nom (#25). Le filtre se fait dans le navigateur :
// un foyer a quelques dizaines de plats, la liste est déjà chargée en entier.
export function DishList({ dishes }: { dishes: DishSummary[] }) {
  const [search, setSearch] = useState("");
  const query = normalizeName(search);
  const visible = query ? dishes.filter((dish) => normalizeName(dish.name).includes(query)) : dishes;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="plats-search" className="sr-only">
        Chercher un plat
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="plats-search"
          type="search"
          placeholder="Chercher un plat"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-xl bg-card pl-10 text-base"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {visible.map((dish) => (
          <li key={dish.id}>
            <Link
              href={`/plats/${dish.id}`}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-semibold">{dish.name}</span>
                <span className="text-sm text-muted-foreground">{describeDish(dish)}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className="my-4 text-center text-muted-foreground">Aucun plat ne correspond.</p>}
    </div>
  );
}
