"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { updatePeopleCount } from "./actions";
import { MAX_PEOPLE_COUNT, MIN_PEOPLE_COUNT } from "./household-fields";

// Boutons − et + pour régler le nombre de personnes du foyer (#9).
// La valeur affichée change tout de suite, et revient en arrière si l'enregistrement échoue.
export function PeopleCountStepper({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: number) {
    if (next < MIN_PEOPLE_COUNT || next > MAX_PEOPLE_COUNT) return;
    const previous = count;
    setError(null);
    setCount(next);
    startTransition(async () => {
      const result = await updatePeopleCount(next);
      if (result.error) {
        setCount(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E6E1D8] bg-white px-4 py-3">
        <p className="text-sm text-[#6B655C]">Sert à découper chaque recette en repas</p>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            aria-label="Retirer une personne"
            disabled={pending || count <= MIN_PEOPLE_COUNT}
            onClick={() => change(count - 1)}
            className="size-11 rounded-xl text-lg"
          >
            −
          </Button>
          <span aria-live="polite" className="w-6 text-center text-lg font-semibold">
            {count}
          </span>
          <Button
            type="button"
            variant="outline"
            aria-label="Ajouter une personne"
            disabled={pending || count >= MAX_PEOPLE_COUNT}
            onClick={() => change(count + 1)}
            className="size-11 rounded-xl text-lg"
          >
            +
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
