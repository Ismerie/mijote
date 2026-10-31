"use client";

import { useState, useTransition } from "react";

import { deleteIngredient } from "../actions";
import type { IngredientWithUsage } from "../queries";

// « Utilisé dans » et la suppression d'un ingrédient (#26) : possible seulement si aucun plat ne l'utilise.
export function IngredientUsage({ ingredient }: { ingredient: IngredientWithUsage }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { dishNames, usedByAnyDish } = ingredient;

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteIngredient(ingredient.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Utilisé dans</h2>
        <p className="text-foreground/80">{dishNames.length > 0 ? dishNames.join(", ") : "Aucun plat"}</p>
      </section>

      {!usedByAnyDish && (
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="min-h-11 text-left font-semibold text-destructive disabled:opacity-50"
        >
          {pending ? "Suppression…" : "Supprimer cet ingrédient"}
        </button>
      )}
      {usedByAnyDish && dishNames.length > 0 && (
        <p className="text-sm text-muted-foreground">Pour le supprimer, retire-le d&apos;abord des plats qui l&apos;utilisent.</p>
      )}
      {usedByAnyDish && dishNames.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Il reste utilisé par un plat supprimé, visible dans les anciens menus : il ne peut pas être supprimé.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
