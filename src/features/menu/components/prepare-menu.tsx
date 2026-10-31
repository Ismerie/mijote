"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { prepareNextMenu } from "../actions";
import { lengthLabel, MENU_LENGTHS, rangeLabel } from "../dates";
import type { CarryOverChoices } from "../menu";
import { portionsLabel } from "../servings";
import { EatenBox } from "./state-boxes";

type Props = {
  fromMenuId: string;
  startDate: string;
  defaultLength: number;
  choices: CarryOverChoices;
};

function CarryLine({ checked, name, sub, onToggle }: { checked: boolean; name: string; sub: string; onToggle: () => void }) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
      >
        <EatenBox eaten={checked} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">{name}</span>
          <span className="text-sm text-muted-foreground">{sub}</span>
        </span>
      </button>
    </li>
  );
}

// « Préparer le menu » (#30) : durée de ce menu, puis ce qui n'a pas été mangé, coché d'avance pour être reporté.
export function PrepareMenu({ fromMenuId, startDate, defaultLength, choices }: Props) {
  const [length, setLength] = useState(defaultLength);
  // Repas décochés : tout est reporté par défaut.
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(mealIds: string[]) {
    setSkipped((current) => {
      const next = new Set(current);
      const on = mealIds.every((id) => !current.has(id));
      for (const id of mealIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function create() {
    const mealIds = [...choices.uncooked.flatMap((line) => line.mealIds), ...choices.leftovers.map((line) => line.mealId)].filter(
      (id) => !skipped.has(id),
    );
    setError(null);
    startTransition(async () => {
      const result = await prepareNextMenu(fromMenuId, length, mealIds);
      if (result?.error) setError(result.error);
    });
  }

  const nothing = choices.uncooked.length === 0 && choices.leftovers.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-2 pt-4 pb-4">
        <Link href="/?menu=prochain" aria-label="Retour" className="flex size-11 shrink-0 items-center justify-center">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Préparer le menu</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 pb-6">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Durée</h2>
          <div role="group" aria-label="Durée" className="grid grid-cols-2 gap-2">
            {MENU_LENGTHS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={length === option}
                onClick={() => setLength(option)}
                className={cn(
                  "h-12 rounded-xl border font-semibold transition-colors",
                  length === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                )}
              >
                {lengthLabel(option)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground">{rangeLabel(startDate, length)}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">À reporter</h2>
          <p className="text-sm text-muted-foreground">
            Tout est déjà acheté : ces repas passent dans le nouveau menu sans compter dans les courses. Décoche ceux que
            tu ne veux pas garder.
          </p>

          {choices.uncooked.length > 0 && (
            <>
              <h3 className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Pas cuisinés</h3>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {choices.uncooked.map((line) => (
                  <CarryLine
                    key={line.menuDishId}
                    checked={line.mealIds.every((id) => !skipped.has(id))}
                    name={line.name}
                    sub={`${portionsLabel(line.servings)} · à cuisiner`}
                    onToggle={() => toggle(line.mealIds)}
                  />
                ))}
              </ul>
            </>
          )}

          {choices.leftovers.length > 0 && (
            <>
              <h3 className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Restes</h3>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {choices.leftovers.map((line) => (
                  <CarryLine
                    key={line.mealId}
                    checked={!skipped.has(line.mealId)}
                    name={line.name}
                    sub={`${portionsLabel(line.servings)} · ${line.when}`}
                    onToggle={() => toggle([line.mealId])}
                  />
                ))}
              </ul>
            </>
          )}

          {nothing && (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Tout a été mangé, rien à reporter.
            </p>
          )}
        </section>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 py-3">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="button" onClick={create} disabled={pending} className="h-12 rounded-xl text-base">
          {pending ? "Création…" : "Créer le menu"}
        </Button>
      </div>
    </div>
  );
}
