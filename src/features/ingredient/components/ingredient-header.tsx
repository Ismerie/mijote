import { ChevronLeft } from "lucide-react";
import Link from "next/link";

// En-tête de la fiche ingrédient : retour au catalogue (ou aux courses, #32) sans enregistrer.
export function IngredientHeader({ title, backHref = "/plats/ingredients" }: { title: string; backHref?: string }) {
  const label = backHref.startsWith("/courses") ? "Retour aux courses" : "Retour aux ingrédients";
  return (
    <header className="flex items-center gap-2 px-2 pt-4 pb-4">
      <Link href={backHref} aria-label={label} className="flex size-11 shrink-0 items-center justify-center">
        <ChevronLeft aria-hidden="true" className="size-6" />
      </Link>
      <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
