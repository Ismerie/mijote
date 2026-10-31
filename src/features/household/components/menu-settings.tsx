"use client";

import { useState, useTransition } from "react";

import { ChoiceChips } from "@/features/ingredient/components/choice-chips";
import { lengthLabel, MENU_LENGTHS, SHOPPING_DAY_LABELS } from "@/features/menu/dates";
import { cn } from "@/lib/utils";

import { updateMenuSettings, type MenuSettings as Settings } from "../actions";

const DAY_OPTIONS = SHOPPING_DAY_LABELS.map((label, index) => ({ value: String(index), label }));

// « Organisation des menus » dans Mon foyer (#28) : jour des courses et durée par défaut d'un menu.
// Le choix s'affiche tout de suite et revient en arrière si l'enregistrement échoue.
export function MenuSettings({ shoppingDay, menuLengthDays }: { shoppingDay: number; menuLengthDays: number }) {
  const [values, setValues] = useState({ shoppingDay, menuLengthDays });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function change(next: Settings) {
    const previous = values;
    setError(null);
    setValues({ ...values, ...next });
    startTransition(async () => {
      const result = await updateMenuSettings(next);
      if (result.error) {
        setValues(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Jour des courses</h3>
          <p className="text-sm text-muted-foreground">Chaque menu commence ce jour-là.</p>
          <ChoiceChips
            label="Jour des courses"
            options={DAY_OPTIONS}
            value={String(values.shoppingDay)}
            onChange={(day) => change({ shoppingDay: Number(day) })}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="font-semibold">Durée d&apos;un menu</h3>
          <p className="text-sm text-muted-foreground">Proposée quand tu prépares un nouveau menu.</p>
          <div role="group" aria-label="Durée d'un menu" className="grid grid-cols-2 gap-2">
            {MENU_LENGTHS.map((length) => {
              const selected = values.menuLengthDays === length;
              return (
                <button
                  key={length}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => change({ menuLengthDays: length })}
                  className={cn(
                    "h-11 rounded-xl border font-semibold transition-colors",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                  )}
                >
                  {lengthLabel(length)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
