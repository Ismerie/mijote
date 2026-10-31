"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { finishShopping } from "../actions";

// « Courses terminées » (#32) : la liste du menu est supprimée ; un plat ajouté ensuite
// fait apparaître seulement ses ingrédients.
export function FinishShoppingButton({ menuId }: { menuId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await finishShopping(menuId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={finish} disabled={pending} className="h-13 rounded-xl text-base">
        {pending ? "Un instant…" : "Courses terminées"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        La liste est supprimée. Si tu ajoutes un plat ensuite, seuls ses ingrédients apparaîtront.
      </p>
    </div>
  );
}
