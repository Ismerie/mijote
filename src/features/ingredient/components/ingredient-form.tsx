"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

import { saveIngredient } from "../actions";
import { AISLES } from "../aisles";
import type { PurchaseMode } from "../ingredient";
import {
  DEFAULT_PACK,
  MAX_INGREDIENT_NAME_LENGTH,
  MAX_PACK_NAME_LENGTH,
  PACK_UNITS,
  packHint,
  type IngredientFormValues,
} from "../ingredient-fields";
import { isUnit, unitLabel } from "../units";
import { ChoiceChips } from "./choice-chips";

const PURCHASE_OPTIONS: { value: PurchaseMode; label: string }[] = [
  { value: "weight", label: "Au poids / volume" },
  { value: "piece", label: "À la pièce" },
  { value: "pack", label: "En paquet" },
];

type Props = {
  // null pour un nouvel ingrédient.
  ingredientId: string | null;
  initialValues: IngredientFormValues;
  // Ce qui s'affiche sous « Toujours en stock » (plats qui l'utilisent, suppression).
  children?: ReactNode;
};

// Fiche ingrédient (#26) : nom, rayon, façon d'acheter, toujours en stock. « OK » enregistre.
export function IngredientForm({ ingredientId, initialValues, children }: Props) {
  const [state, formAction, pending] = useActionState(saveIngredient.bind(null, ingredientId), {});
  const [values, setValues] = useState(initialValues);
  const set = (patch: Partial<IngredientFormValues>) => setValues((current) => ({ ...current, ...patch }));

  function changePurchaseMode(purchaseMode: PurchaseMode) {
    // En passant à « En paquet » sans paquet connu, on propose « paquet de 500 g » (comme la maquette).
    if (purchaseMode === "pack" && !values.packName && !values.packSize) {
      set({ purchaseMode, packName: DEFAULT_PACK.packName, packSize: DEFAULT_PACK.packSize, packUnit: DEFAULT_PACK.packUnit });
    } else {
      set({ purchaseMode });
    }
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col" noValidate>
      {/* Les choix faits avec des pastilles et l'interrupteur partent dans des champs cachés. */}
      <input type="hidden" name="aisle" value={values.aisle} />
      <input type="hidden" name="purchaseMode" value={values.purchaseMode} />
      <input type="hidden" name="alwaysInStock" value={String(values.alwaysInStock)} />

      <div className="flex flex-col gap-6 px-4 pb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ing-name">Nom</Label>
          <Input
            id="ing-name"
            name="name"
            autoComplete="off"
            placeholder="Ex. Coulis de tomates"
            required
            maxLength={MAX_INGREDIENT_NAME_LENGTH}
            value={values.name}
            onChange={(event) => set({ name: event.target.value })}
            className="h-11 bg-card"
          />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Rayon</h2>
          <ChoiceChips label="Rayon" options={AISLES} value={values.aisle} onChange={(aisle) => set({ aisle })} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Comment tu l&apos;achètes ?</h2>
          <ChoiceChips
            label="Comment tu l'achètes ?"
            options={PURCHASE_OPTIONS}
            value={values.purchaseMode}
            onChange={changePurchaseMode}
          />
          {values.purchaseMode === "pack" && (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5rem] gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ing-pack" className="font-normal text-muted-foreground">
                    Paquet
                  </Label>
                  <Input
                    id="ing-pack"
                    name="packName"
                    maxLength={MAX_PACK_NAME_LENGTH}
                    value={values.packName}
                    onChange={(event) => set({ packName: event.target.value })}
                    className="h-11 bg-card"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ing-size" className="font-normal text-muted-foreground">
                    Contient
                  </Label>
                  <Input
                    id="ing-size"
                    name="packSize"
                    inputMode="decimal"
                    value={values.packSize}
                    onChange={(event) => set({ packSize: event.target.value })}
                    className="h-11 bg-card"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ing-unit" className="font-normal text-muted-foreground">
                    Unité
                  </Label>
                  <NativeSelect
                    id="ing-unit"
                    name="packUnit"
                    value={values.packUnit}
                    onChange={(event) => isUnit(event.target.value) && set({ packUnit: event.target.value })}
                    className="h-11 bg-card"
                  >
                    {PACK_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unitLabel(unit)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{packHint(values.packName)}</p>
            </>
          )}
        </section>

        <button
          type="button"
          role="switch"
          aria-checked={values.alwaysInStock}
          onClick={() => set({ alwaysInStock: !values.alwaysInStock })}
          className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left"
        >
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="font-semibold">Toujours en stock</span>
            <span className="text-sm text-muted-foreground">Il n&apos;apparaît jamais dans la liste de courses.</span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
              values.alwaysInStock ? "justify-end bg-primary" : "justify-start bg-border",
            )}
          >
            <span className="size-6 rounded-full bg-card shadow-sm" />
          </span>
        </button>

        {children}
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 py-3">
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-12 rounded-xl text-base">
          {pending ? "Enregistrement…" : "OK"}
        </Button>
      </div>
    </form>
  );
}
