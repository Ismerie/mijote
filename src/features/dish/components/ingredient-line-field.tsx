"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AISLES, aisleLabel, type Aisle } from "@/features/ingredient/aisles";
import { describePurchase } from "@/features/ingredient/format";
import type { Ingredient } from "@/features/ingredient/ingredient";
import { findByExactName, searchByName } from "@/features/ingredient/search";
import { UNITS, isUnit, type Unit } from "@/features/ingredient/units";

// Une ligne d'ingrédient en cours de saisie dans le formulaire d'un plat.
export type LineState = {
  key: string;
  name: string;
  quantity: string;
  unit: Unit;
  // L'utilisatrice a choisi « Créer … comme nouvel ingrédient » : on lui demande le rayon.
  isNew: boolean;
  aisle?: Aisle;
};

type Props = {
  line: LineState;
  index: number;
  catalog: Ingredient[];
  onChange: (patch: Partial<LineState>) => void;
  onRemove: () => void;
};

// Unité proposée quand on choisit un ingrédient connu, d'après la façon dont on l'achète.
function suggestedUnit(ingredient: Ingredient, current: Unit): Unit {
  if (ingredient.purchaseMode === "piece") return "piece";
  if (ingredient.purchaseMode === "pack" && ingredient.packUnit) return ingredient.packUnit;
  return current;
}

// Nom (avec autocomplétion sur le catalogue du foyer), quantité et unité d'une ligne (#25).
// Un nom inconnu crée l'ingrédient à l'enregistrement du plat, avec le rayon choisi ici.
export function IngredientLineField({ line, index, catalog, onChange, onRemove }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const typed = line.name.trim();
  const suggestions = open ? searchByName(catalog, typed) : [];
  const known = findByExactName(catalog, typed);
  const showList = open && typed.length > 0 && (suggestions.length > 0 || !known);
  const listId = `${id}-suggestions`;

  function pick(ingredient: Ingredient) {
    onChange({ name: ingredient.name, unit: suggestedUnit(ingredient, line.unit), isNew: false, aisle: undefined });
    setOpen(false);
  }

  function create() {
    onChange({ name: typed, isNew: true, aisle: undefined });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[minmax(0,1fr)_4rem_5.5rem_2.75rem] gap-1.5">
        <label htmlFor={`${id}-name`} className="sr-only">
          Ingrédient {index + 1}
        </label>
        <Input
          id={`${id}-name`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Ingrédient"
          value={line.name}
          onChange={(event) => {
            onChange({ name: event.target.value, isNew: false, aisle: undefined });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="h-11 bg-card"
        />
        <label htmlFor={`${id}-qty`} className="sr-only">
          Quantité
        </label>
        <Input
          id={`${id}-qty`}
          inputMode="decimal"
          placeholder="Qté"
          value={line.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
          className="h-11 bg-card"
        />
        <label htmlFor={`${id}-unit`} className="sr-only">
          Unité
        </label>
        <NativeSelect
          id={`${id}-unit`}
          value={line.unit}
          onChange={(event) => isUnit(event.target.value) && onChange({ unit: event.target.value })}
          className="h-11 bg-card"
        >
          {UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Retirer ${typed || "cet ingrédient"}`}
          onClick={onRemove}
          className="h-11 text-muted-foreground"
        >
          <X />
        </Button>
      </div>

      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label="Ingrédients déjà connus"
          // mousedown avant le blur du champ : sans ça, la liste se fermerait avant le clic.
          onMouseDown={(event) => event.preventDefault()}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          {suggestions.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">Déjà dans tes plats</p>
          )}
          {suggestions.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => pick(ingredient)}
              className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-1.5 text-left hover:bg-muted"
            >
              <span>{ingredient.name}</span>
              <span className="text-xs text-muted-foreground">
                {aisleLabel(ingredient.aisle)} · {describePurchase(ingredient)}
              </span>
            </button>
          ))}
          {!known && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={create}
              className="flex min-h-11 w-full items-center gap-2 border-t border-border px-3 text-left font-semibold text-primary hover:bg-muted"
            >
              <Plus aria-hidden="true" className="size-4" />
              Créer « {typed} » comme nouvel ingrédient
            </button>
          )}
        </div>
      )}

      {line.isNew && !line.aisle && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5">
          <p className="font-semibold">Nouvel ingrédient : « {typed} »</p>
          <p className="text-sm text-muted-foreground">
            Dans quel rayon on le trouve ? C&apos;est demandé une seule fois, puis réutilisé partout.
          </p>
          <div className="flex flex-wrap gap-2">
            {AISLES.map((aisle) => (
              <Button
                key={aisle.value}
                type="button"
                variant="outline"
                onClick={() => onChange({ aisle: aisle.value })}
                className="h-9 rounded-full px-3"
              >
                {aisle.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {line.isNew && line.aisle && (
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          Nouvel ingrédient · {aisleLabel(line.aisle)}
          <Button type="button" variant="link" onClick={() => onChange({ aisle: undefined })} className="h-auto px-1">
            Changer
          </Button>
        </p>
      )}
    </div>
  );
}
