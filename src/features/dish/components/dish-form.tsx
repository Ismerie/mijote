"use client";

import { Plus } from "lucide-react";
import { useActionState, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Ingredient } from "@/features/ingredient/ingredient";
import { DEFAULT_UNIT } from "@/features/ingredient/units";

import { saveDish } from "../actions";
import { MAX_DISH_NAME_LENGTH, MAX_RECIPE_LENGTH, MAX_SERVINGS, MIN_SERVINGS, type DishFormValues } from "../dish-fields";
import { IngredientLineField, type LineState } from "./ingredient-line-field";

type Props = {
  // null pour un nouveau plat.
  dishId: string | null;
  initialValues: DishFormValues;
  // Catalogue d'ingrédients du foyer, pour l'autocomplétion.
  catalog: Ingredient[];
  // Contenu ajouté sous les macros (le bouton « Supprimer ce plat » en modification).
  children?: ReactNode;
};

const MACROS = [
  { key: "kcal", label: "Calories (kcal)" },
  { key: "protein", label: "Protéines (g)" },
  { key: "carbs", label: "Glucides (g)" },
  { key: "fat", label: "Lipides (g)" },
] as const;

// Formulaire « Nouveau plat » et « Modifier le plat » (#25).
// Tous les champs sont contrôlés : après un envoi refusé, rien de ce qui a été tapé n'est perdu.
export function DishForm({ dishId, initialValues, catalog, children }: Props) {
  const [state, formAction, pending] = useActionState(saveDish.bind(null, dishId), {});
  // Les lignes de départ prennent les clés line-0, line-1… ; les suivantes continuent la numérotation.
  const nextKey = useRef(initialValues.lines.length);

  const [fields, setFields] = useState(() => ({
    name: initialValues.name,
    servings: initialValues.servings,
    recipe: initialValues.recipe,
    kcal: initialValues.kcal,
    protein: initialValues.protein,
    carbs: initialValues.carbs,
    fat: initialValues.fat,
  }));
  const [lines, setLines] = useState<LineState[]>(() =>
    initialValues.lines.map((line, index) => ({ ...line, key: `line-${index}`, isNew: false })),
  );

  const setField = (key: keyof typeof fields) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [key]: event.target.value }));

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    const key = `line-${nextKey.current++}`;
    setLines((current) => [...current, { key, name: "", quantity: "", unit: DEFAULT_UNIT, isNew: false }]);
  }

  // Le rayon n'est envoyé que pour un ingrédient créé ici ; la base l'ignore pour un ingrédient connu.
  const linesJson = JSON.stringify(
    lines.map(({ name, quantity, unit, isNew, aisle }) => ({ name, quantity, unit, aisle: isNew ? aisle : undefined })),
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col" noValidate>
      <input type="hidden" name="lines" value={linesJson} />

      <div className="flex flex-col gap-6 px-4 pb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom du plat</Label>
            <Input
              id="name"
              name="name"
              autoComplete="off"
              placeholder="Ex. Gratin dauphinois"
              required
              maxLength={MAX_DISH_NAME_LENGTH}
              value={fields.name}
              onChange={setField("name")}
              className="h-11 bg-card"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="servings">Portions</Label>
            <Input
              id="servings"
              name="servings"
              type="number"
              inputMode="numeric"
              min={MIN_SERVINGS}
              max={MAX_SERVINGS}
              step={1}
              required
              value={fields.servings}
              onChange={setField("servings")}
              className="h-11 bg-card"
            />
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Ingrédients</h2>
          {lines.map((line, index) => (
            <IngredientLineField
              key={line.key}
              line={line}
              index={index}
              catalog={catalog}
              onChange={(patch) => updateLine(line.key, patch)}
              onRemove={() => setLines((current) => current.filter((l) => l.key !== line.key))}
            />
          ))}
          <button
            type="button"
            onClick={addLine}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/50 font-semibold text-primary"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un ingrédient
          </button>
        </section>

        <section className="flex flex-col gap-2">
          <Label htmlFor="recipe" className="text-lg font-semibold">
            Recette
          </Label>
          <Textarea
            id="recipe"
            name="recipe"
            rows={6}
            placeholder="Les étapes, en texte libre"
            maxLength={MAX_RECIPE_LENGTH}
            value={fields.recipe}
            onChange={setField("recipe")}
            className="min-h-36 bg-card"
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Macros par portion <span className="text-sm font-normal text-muted-foreground">(facultatif)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {MACROS.map((macro) => (
              <div key={macro.key} className="flex flex-col gap-1.5">
                <Label htmlFor={macro.key} className="font-normal text-muted-foreground">
                  {macro.label}
                </Label>
                <Input
                  id={macro.key}
                  name={macro.key}
                  inputMode="decimal"
                  value={fields[macro.key]}
                  onChange={setField(macro.key)}
                  className="h-11 bg-card"
                />
              </div>
            ))}
          </div>
        </section>

        {children}
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 py-3">
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-12 rounded-xl text-base">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
