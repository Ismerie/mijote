import { Plus } from "lucide-react";
import Link from "next/link";

// « Ajouter un plat au menu », en bas de l'accueil (#28). menuId : le menu affiché (absent = le premier menu à créer).
export function AddDishLink({ menuId }: { menuId?: string }) {
  return (
    <Link
      href={menuId ? `/menu/ajouter?menu=${menuId}` : "/menu/ajouter"}
      className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border font-semibold text-primary"
    >
      <Plus aria-hidden="true" className="size-5" />
      Ajouter un plat au menu
    </Link>
  );
}
