"use client";

import { Check, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

import { setShoppingCheck } from "../actions";
import type { ShoppingGroup, ShoppingLine } from "../shopping-list";

type Props = {
  menuId: string;
  groups: ShoppingGroup[];
};

// Les lignes de courses par rayon (#32). Cocher change tout de suite, puis la base suit ;
// les autres membres voient la coche au rechargement. ⋯ ouvre la fiche de l'ingrédient (#26).
export function ShoppingListView({ menuId, groups }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(
    groups,
    (current, { key, checked }: { key: string; checked: boolean }) =>
      current.map((group) => ({
        ...group,
        lines: group.lines.map((line) => (line.key === key ? { ...line, checked } : line)),
      })),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(line: ShoppingLine) {
    const checked = !line.checked;
    setError(null);
    startTransition(async () => {
      setOptimistic({ key: line.key, checked });
      const result = await setShoppingCheck(menuId, line.ingredientId, line.measure, checked);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {optimistic.map((group) => (
        <section key={group.aisle} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{group.label}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {group.lines.map((line) => (
              <li key={line.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggle(line)}
                  aria-pressed={line.checked}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2.5 pr-1 pl-3.5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      line.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60 bg-card",
                    )}
                  >
                    {line.checked && <Check className="size-4" strokeWidth={3} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("font-semibold", line.checked && "text-muted-foreground line-through")}>
                      {line.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{line.dishNames.join(", ")}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className={cn("font-semibold whitespace-nowrap", line.checked && "text-muted-foreground")}>
                      {line.quantity}
                    </span>
                    {line.detail && <span className="text-xs whitespace-nowrap text-muted-foreground">{line.detail}</span>}
                  </span>
                </button>
                <Link
                  href={`/plats/ingredients/${line.ingredientId}?depuis=courses&menu=${menuId}`}
                  aria-label={`Réglages de l’ingrédient : ${line.name}`}
                  className="flex h-14 w-11 shrink-0 items-center justify-center text-muted-foreground"
                >
                  <Ellipsis aria-hidden="true" className="size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
