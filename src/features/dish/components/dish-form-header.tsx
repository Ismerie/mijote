import { X } from "lucide-react";
import Link from "next/link";

// En-tête des écrans « Nouveau plat » et « Modifier le plat » : une croix pour fermer sans enregistrer.
export function DishFormHeader({ title, closeHref }: { title: string; closeHref: string }) {
  return (
    <header className="flex items-center gap-2 px-2 pt-4 pb-4">
      <Link href={closeHref} aria-label="Fermer sans enregistrer" className="flex size-11 items-center justify-center">
        <X aria-hidden="true" className="size-6" />
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
