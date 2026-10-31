"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

import { setMenuDishState } from "../actions";
import {
  carriedOverLabel,
  menuDishState,
  menuDishSubtitle,
  nextMenuDishState,
  withMenuDishState,
  type MenuDish,
  type MenuDishState,
} from "../menu";
import { CarriedOverBadge, DishStateBox, dishStateActionLabel } from "./state-boxes";

// Vue « En liste » de l'accueil (#28) : une carte par fournée, avec sa case ronde à trois états.
// Toucher la carte ouvre la fiche « plat au menu ». La case change tout de suite, puis la base suit.
export function MenuDishList({ dishes }: { dishes: MenuDish[] }) {
  const [optimistic, setOptimistic] = useOptimistic(
    dishes,
    (current, { id, state }: { id: string; state: MenuDishState }) =>
      current.map((dish) => (dish.id === id ? withMenuDishState(dish, state, new Date().toISOString()) : dish)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(dish: MenuDish) {
    const state = nextMenuDishState(menuDishState(dish));
    setError(null);
    startTransition(async () => {
      setOptimistic({ id: dish.id, state });
      const result = await setMenuDishState(dish.id, state);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {optimistic.map((dish) => {
          const state = menuDishState(dish);
          const badge = carriedOverLabel(dish);
          return (
            <li key={dish.id} className="flex min-h-16 items-center rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => toggle(dish)}
                aria-label={dishStateActionLabel(state, dish.name)}
                className="flex size-14 shrink-0 items-center justify-center self-stretch"
              >
                <DishStateBox state={state} />
              </button>
              <Link href={`/menu/plat/${dish.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate font-semibold",
                      state === "eaten" && "text-muted-foreground line-through",
                    )}
                  >
                    {dish.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    {menuDishSubtitle(dish)}
                    {badge && <CarriedOverBadge label={badge} />}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
