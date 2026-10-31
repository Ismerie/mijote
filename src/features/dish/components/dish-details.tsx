import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatNumber, formatQuantity } from "@/features/ingredient/format";

import type { Dish } from "../dish";

// Fiche du plat (#25) : portions, ingrédients, recette et macros par portion.
export function DishDetails({ dish }: { dish: Dish }) {
  const macros = [
    { label: "kcal", value: dish.kcal, unit: "" },
    { label: "Protéines", value: dish.protein, unit: " g" },
    { label: "Glucides", value: dish.carbs, unit: " g" },
    { label: "Lipides", value: dish.fat, unit: " g" },
  ];
  const hasMacros = macros.some((macro) => macro.value !== null);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-background px-4 pt-4 pb-8 text-foreground">
      <nav className="-mx-2 flex items-center justify-between">
        <Link href="/plats" aria-label="Retour aux plats" className="flex size-11 items-center justify-center">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <Link href={`/plats/${dish.id}/modifier`} className="flex h-11 items-center px-2 font-semibold text-primary">
          Modifier
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{dish.name}</h1>
        <p className="text-muted-foreground">
          La recette donne {dish.servings} portion{dish.servings > 1 ? "s" : ""}
        </p>
      </header>

      {/* Ouvre directement le récapitulatif « Combien de fois la recette ? » avec ce plat (#28). */}
      <Link href={`/menu/ajouter?plat=${dish.id}`} className={buttonVariants({ className: "h-12 rounded-xl text-base" })}>
        Ajouter au menu de la semaine
      </Link>

      {dish.ingredients.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Ingrédients</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {dish.ingredients.map((line, index) => (
              <li key={`${line.ingredientId}-${index}`} className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
                <span>{line.name}</span>
                <span className="shrink-0 text-muted-foreground">{formatQuantity(line.quantity, line.unit)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dish.recipe && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Recette</h2>
          <p className="leading-relaxed whitespace-pre-line">{dish.recipe}</p>
        </section>
      )}

      {hasMacros && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Macros par portion</h2>
          <dl className="grid grid-cols-4 gap-2">
            {macros.map((macro) => (
              <div key={macro.label} className="flex flex-col-reverse items-center rounded-xl border border-border bg-card px-1 py-3">
                <dt className="text-xs text-muted-foreground">{macro.label}</dt>
                <dd className="text-lg font-bold">
                  {macro.value === null ? "–" : `${formatNumber(macro.value)}${macro.unit}`}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </main>
  );
}
