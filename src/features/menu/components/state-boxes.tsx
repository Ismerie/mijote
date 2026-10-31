import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MenuDishState } from "../menu";

// Case ronde d'un plat au menu, à trois états : vide = à cuisiner, contour vert = cuisiné, pleine = tout mangé.
// Seulement le dessin : le bouton qui l'entoure porte le libellé et l'action.
export function DishStateBox({ state }: { state: MenuDishState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        state === "to_cook" && "border-muted-foreground/60 bg-card",
        state === "cooked" && "border-primary bg-primary/10 text-primary",
        state === "eaten" && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {state !== "to_cook" && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}

// Case carrée « mangé » d'un repas.
export function EatenBox({ eaten }: { eaten: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        eaten ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60 bg-card",
      )}
    >
      {eaten && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}

// Libellé du bouton de la case ronde, pour les lecteurs d'écran (repris de la maquette).
export function dishStateActionLabel(state: MenuDishState, name: string): string {
  if (state === "to_cook") return `Marquer comme cuisiné : ${name}`;
  if (state === "cooked") return `Marquer comme tout mangé : ${name}`;
  return `Remettre à cuisiner : ${name}`;
}

// Badge « Reporté » ou « Reste » d'un plat reporté du menu précédent (#30).
export function CarriedOverBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">{label}</span>
  );
}
