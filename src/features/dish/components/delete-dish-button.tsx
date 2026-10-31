"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { archiveDish } from "../actions";

// « Supprimer ce plat », avec une confirmation (#25). Suppression douce : le plat disparaît de Plats
// mais reste dans les menus où il est déjà.
export function DeleteDishButton({ dishId, dishName }: { dishId: string; dishName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await archiveDish(dishId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-2.5 border-t border-border pt-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-11 text-left font-semibold text-destructive"
        >
          Supprimer ce plat
        </button>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-xl bg-destructive/10 p-3.5">
          <p className="font-semibold">Supprimer « {dishName} » ?</p>
          <p className="text-sm text-destructive">
            Il disparaît de tes plats. Les anciens menus qui le contiennent restent consultables.
          </p>
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
              {pending ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
