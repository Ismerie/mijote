"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { placeMeal, removeMeal, splitMeal } from "../actions";
import { MEAL_SLOTS, menuDays, splitOptions, type Meal, type MealSlot, type MenuDish, type MenuPeriod } from "../menu";
import { portionsLabel } from "../servings";

type Props = {
  meal: Meal;
  dish: MenuDish;
  menu: MenuPeriod;
  // Ouverte depuis la fiche du plat au menu : le retour y revient ; sinon, retour à la vue Par jour.
  fromDish: boolean;
};

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-11 rounded-full border px-4 font-semibold transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// Fiche d'un repas (#29) : lien vers son plat au menu, « Séparer ce repas », jour et moment facultatifs,
// et « Retirer ce repas du menu ». Un choix s'enregistre tout de suite ; OK ramène d'où on vient.
export function MealDetails({ meal, dish, menu, fromDish }: Props) {
  const [placement, setPlacement] = useState({ date: meal.date, slot: meal.slot });
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const backHref = fromDish ? `/menu/plat/${dish.id}` : `/?menu=${menu.id}&vue=jour`;

  function place(next: { date: string | null; slot: MealSlot | null }) {
    const previous = placement;
    setError(null);
    setPlacement(next);
    startTransition(async () => {
      const result = await placeMeal(meal.id, next.date, next.slot);
      if (result.error) {
        setPlacement(previous);
        setError(result.error);
      }
    });
  }

  function split(moved: number) {
    setError(null);
    startTransition(async () => {
      const result = await splitMeal(meal.id, moved);
      if (result.error) setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMeal(meal.id, menu.id, fromDish ? dish.id : null);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-2 pt-4 pb-4">
        <Link href={backHref} aria-label="Retour" className="flex size-11 shrink-0 items-center justify-center">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <h1 className="truncate text-2xl font-bold tracking-tight">{dish.name}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 pb-6">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
          <p className="font-semibold">{portionsLabel(meal.servings)}</p>
          <p className="text-sm text-muted-foreground">
            Recette de {portionsLabel(dish.dishServings)}
            {dish.carriedOver ? ", reportée du menu précédent" : ""}
          </p>
          <Link
            href={`/menu/plat/${dish.id}`}
            className="flex min-h-11 items-center self-start font-semibold text-primary underline underline-offset-4"
          >
            Voir {dish.name} au menu
          </Link>
        </div>

        {meal.servings > 1 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">Séparer ce repas</h2>
            <p className="text-sm text-muted-foreground">
              Pour des portions que vous ne mangez pas ensemble. La nouvelle part arrive sans jour, à placer.
            </p>
            <div className="flex flex-wrap gap-2">
              {splitOptions(meal.servings).map((option) => (
                <button
                  key={option.moved}
                  type="button"
                  disabled={pending}
                  onClick={() => split(option.moved)}
                  className="h-11 rounded-full border border-border bg-card px-4 font-semibold"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">
            Jour <span className="font-normal text-muted-foreground">(facultatif)</span>
          </h2>
          <div role="group" aria-label="Jour" className="flex flex-wrap gap-2">
            <Chip selected={placement.date === null} onClick={() => place({ ...placement, date: null })}>
              Pas de jour
            </Chip>
            {menuDays(menu).map((day) => (
              <Chip key={day.date} selected={placement.date === day.date} onClick={() => place({ ...placement, date: day.date })}>
                {day.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">
            Moment <span className="font-normal text-muted-foreground">(facultatif)</span>
          </h2>
          <div role="group" aria-label="Moment" className="flex flex-wrap gap-2">
            <Chip selected={placement.slot === null} onClick={() => place({ ...placement, slot: null })}>
              Aucun
            </Chip>
            {MEAL_SLOTS.map((slot) => (
              <Chip key={slot.value} selected={placement.slot === slot.value} onClick={() => place({ ...placement, slot: slot.value })}>
                {slot.label}
              </Chip>
            ))}
          </div>
        </section>
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
            <button type="button" onClick={() => setConfirming(true)} className="min-h-11 font-semibold text-destructive">
              Retirer ce repas du menu
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2.5 rounded-xl bg-destructive/10 p-3.5">
            <p className="font-semibold">Retirer ce repas de {portionsLabel(meal.servings)} ?</p>
            <p className="text-sm text-destructive">Les autres repas de {dish.name} restent au menu.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="h-11 rounded-xl">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={remove}
                className="h-11 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90"
              >
                {pending ? "Retrait…" : "Retirer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
