"use client";

import { Check, ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DishSummary } from "@/features/dish/dish";
import { describeDish } from "@/features/dish/dish-fields";
import { normalizeName } from "@/features/ingredient/search";
import { cn } from "@/lib/utils";

import { addDishesToMenu } from "../actions";
import { MAX_TIMES } from "../menu-fields";
import { describeSplit } from "../servings";

type Props = {
  dishes: DishSummary[];
  // Plats qui ont déjà une fournée dans le menu : badge « Déjà au menu ».
  inMenu: string[];
  menuId: string | null;
  peopleCount: number;
  // Depuis la fiche d'un plat : ce plat est choisi d'avance et on arrive directement au récapitulatif.
  preselected: string | null;
  backHref: string;
};

// « Ajouter au menu » en deux étapes (#28) : choisir plusieurs plats, puis × N pour chacun et valider.
export function AddDishes({ dishes, inMenu, menuId, peopleCount, preselected, backHref }: Props) {
  // Plats choisis dans l'ordre où on les a cochés, avec leur × N.
  const [selection, setSelection] = useState<{ dishId: string; times: number }[]>(
    preselected ? [{ dishId: preselected, times: 1 }] : [],
  );
  const [step, setStep] = useState<"pick" | "recap">(preselected ? "recap" : "pick");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = new Map(dishes.map((dish) => [dish.id, dish]));
  const query = normalizeName(search);
  const visible = query ? dishes.filter((dish) => normalizeName(dish.name).includes(query)) : dishes;
  const cards = selection.reduce((sum, item) => sum + item.times, 0);

  function toggle(dishId: string) {
    setSelection((current) =>
      current.some((item) => item.dishId === dishId)
        ? current.filter((item) => item.dishId !== dishId)
        : [...current, { dishId, times: 1 }],
    );
  }

  function setTimes(dishId: string, times: number) {
    if (times < 1 || times > MAX_TIMES) return;
    setSelection((current) => current.map((item) => (item.dishId === dishId ? { ...item, times } : item)));
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await addDishesToMenu(menuId, selection);
      if (result?.error) setError(result.error);
    });
  }

  if (step === "pick") {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 px-2 pt-4 pb-4">
          <Link href={backHref} aria-label="Retour au menu" className="flex size-11 shrink-0 items-center justify-center">
            <ChevronLeft aria-hidden="true" className="size-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Quels plats ajouter ?</h1>
        </header>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <label htmlFor="menu-search" className="sr-only">
            Chercher un plat
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="menu-search"
              type="search"
              placeholder="Chercher un plat"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 rounded-xl bg-card pl-10 text-base"
            />
          </div>

          <ul className="flex flex-col gap-2">
            {visible.map((dish) => {
              const selected = selection.some((item) => item.dishId === dish.id);
              return (
                <li key={dish.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(dish.id)}
                    className={cn(
                      "flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-semibold">{dish.name}</span>
                      <span className="text-sm text-muted-foreground">{describeDish(dish)}</span>
                    </span>
                    {inMenu.includes(dish.id) && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Déjà au menu
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60 bg-card",
                      )}
                    >
                      {selected && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {dishes.length === 0 && (
            <p className="my-4 text-center text-muted-foreground">
              Pas encore de plat.{" "}
              <Link href="/plats/nouveau" className="font-semibold text-primary underline underline-offset-4">
                Créer un plat
              </Link>
            </p>
          )}
          {dishes.length > 0 && visible.length === 0 && (
            <p className="my-4 text-center text-muted-foreground">Aucun plat ne correspond.</p>
          )}
        </div>

        {selection.length > 0 && (
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto border-t border-border bg-background px-4 py-3">
            <Button type="button" onClick={() => setStep("recap")} className="h-12 w-full rounded-xl text-base">
              Continuer avec {selection.length} plat{selection.length > 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-2 pt-4 pb-4">
        {preselected ? (
          <Link href={backHref} aria-label="Retour" className="flex size-11 shrink-0 items-center justify-center">
            <ChevronLeft aria-hidden="true" className="size-6" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep("pick")}
            aria-label="Retour au choix des plats"
            className="flex size-11 shrink-0 items-center justify-center"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Combien de fois la recette ?</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-6">
        <p className="text-sm text-muted-foreground">
          Chaque fois fait une carte à cuisiner. Ses portions sont découpées en repas pour {peopleCount}{" "}
          personne{peopleCount > 1 ? "s" : ""}.
        </p>
        <ul className="flex flex-col gap-2">
          {selection.map(({ dishId, times }) => {
            const dish = byId.get(dishId);
            if (!dish) return null;
            return (
              <li key={dishId} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{dish.name}</span>
                  <span className="text-sm text-muted-foreground">{describeSplit(dish.servings, times, peopleCount)}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Une fois de moins : ${dish.name}`}
                    disabled={times <= 1}
                    onClick={() => setTimes(dishId, times - 1)}
                    className="size-11 rounded-xl text-lg"
                  >
                    −
                  </Button>
                  <span aria-live="polite" className="w-8 text-center text-lg font-semibold">
                    ×{times}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Une fois de plus : ${dish.name}`}
                    disabled={times >= MAX_TIMES}
                    onClick={() => setTimes(dishId, times + 1)}
                    className="size-11 rounded-xl text-lg"
                  >
                    +
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted-foreground">
          Chaque repas arrive au menu sans jour. Touche-le ensuite pour choisir quand vous le mangez.
        </p>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 py-3">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="button" onClick={confirm} disabled={pending || cards === 0} className="h-12 rounded-xl text-base">
          {pending ? "Ajout…" : `Ajouter ${cards} plat${cards > 1 ? "s" : ""} au menu`}
        </Button>
        <p className="text-center text-sm text-muted-foreground">Leurs ingrédients arrivent dans la liste de courses.</p>
      </div>
    </div>
  );
}
