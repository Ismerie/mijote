"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { removeMenuDish, setMealEaten, setMenuDishState } from "../actions";
import { capitalize, dayInParis, shortDay } from "../dates";
import {
  carriedOverLabel,
  mealWhen,
  menuDishState,
  nextMenuDishState,
  totalServings,
  withMealEaten,
  withMenuDishState,
  type MenuDish,
  type MenuDishState,
} from "../menu";
import { portionsLabel } from "../servings";
import { CarriedOverBadge, DishStateBox, dishStateActionLabel, EatenBox } from "./state-boxes";

type Change = { kind: "state"; state: MenuDishState } | { kind: "meal"; mealId: string; eaten: boolean };

const STATE_HINTS: Record<MenuDishState, string> = {
  to_cook: "Touche quand le plat est cuisiné.",
  cooked: "Touche quand tout est mangé.",
  eaten: "Touche pour remettre à cuisiner.",
};

// Fiche « plat au menu » (#28) : la case à trois états avec son libellé, ses repas avec leur case « mangé »,
// la recette, et « Retirer ce plat du menu ».
export function MenuDishDetails({ dish, menuId }: { dish: MenuDish; menuId: string }) {
  const [optimistic, apply] = useOptimistic(dish, (current, change: Change) => {
    const now = new Date().toISOString();
    return change.kind === "state"
      ? withMenuDishState(current, change.state, now)
      : withMealEaten(current, change.mealId, change.eaten, now);
  });
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removing, startRemoving] = useTransition();

  const state = menuDishState(optimistic);
  const badge = carriedOverLabel(optimistic);
  const backHref = `/?menu=${menuId}`;

  function run(change: Change) {
    setError(null);
    startTransition(async () => {
      apply(change);
      const result =
        change.kind === "state"
          ? await setMenuDishState(dish.id, change.state)
          : await setMealEaten(change.mealId, change.eaten);
      if (result.error) setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startRemoving(async () => {
      const result = await removeMenuDish(dish.id, menuId);
      if (result?.error) setError(result.error);
    });
  }

  const stateTitle =
    state === "to_cook"
      ? "À cuisiner"
      : state === "eaten"
        ? "Tout mangé"
        : `Cuisiné le ${shortDay(dayInParis(optimistic.cookedAt!))}`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-2 pt-4 pb-4">
        <Link href={backHref} aria-label="Retour au menu" className="flex size-11 shrink-0 items-center justify-center">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <h1 className="truncate text-2xl font-bold tracking-tight">{optimistic.name}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 pb-6">
        <button
          type="button"
          onClick={() => run({ kind: "state", state: nextMenuDishState(state) })}
          aria-label={dishStateActionLabel(state, optimistic.name)}
          className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left"
        >
          <DishStateBox state={state} />
          <span className="flex flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2 font-semibold">
              {stateTitle}
              {badge && <CarriedOverBadge label={badge} />}
            </span>
            <span className="text-sm text-muted-foreground">{STATE_HINTS[state]}</span>
          </span>
        </button>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">
            Repas <span className="font-normal text-muted-foreground">· {portionsLabel(totalServings(optimistic))}</span>
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {optimistic.meals.map((meal) => (
              <li key={meal.id} className="flex min-h-16 items-center">
                <button
                  type="button"
                  onClick={() => run({ kind: "meal", mealId: meal.id, eaten: !meal.eaten })}
                  aria-label={`${meal.eaten ? "Marquer comme pas mangé" : "Marquer comme mangé"} : ${portionsLabel(meal.servings)}`}
                  className="flex size-14 shrink-0 items-center justify-center self-stretch"
                >
                  <EatenBox eaten={meal.eaten} />
                </button>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-3 pr-4">
                  <span className={cn("font-semibold", meal.eaten && "text-muted-foreground line-through")}>
                    {portionsLabel(meal.servings)}
                  </span>
                  <span className="text-sm text-muted-foreground">{capitalize(mealWhen(meal))}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {!optimistic.dishArchived && (
          <Link
            href={`/plats/${optimistic.dishId}`}
            className="flex min-h-11 items-center self-start font-semibold text-primary underline underline-offset-4"
          >
            Voir la recette
          </Link>
        )}
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 py-3">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!confirming ? (
          <>
            <Link href={backHref} className={buttonVariants({ className: "h-12 rounded-xl text-base" })}>
              OK
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(true)}
              className="min-h-11 font-semibold text-destructive"
            >
              Retirer ce plat du menu
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2.5 rounded-xl bg-destructive/10 p-3.5">
            <p className="font-semibold">Retirer « {optimistic.name} » du menu ?</p>
            <p className="text-sm text-destructive">Ses repas disparaissent aussi du menu.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="h-11 rounded-xl">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={removing}
                onClick={remove}
                className="h-11 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90"
              >
                {removing ? "Retrait…" : "Retirer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
