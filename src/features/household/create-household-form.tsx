"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createHousehold } from "./actions";
import {
  DEFAULT_SERVINGS,
  MAX_FIRST_NAME_LENGTH,
  MAX_HOUSEHOLD_NAME_LENGTH,
  MAX_SERVINGS,
  MIN_SERVINGS,
} from "./household-fields";

export function CreateHouseholdForm() {
  const [state, formAction, pending] = useActionState(createHousehold, {});
  const fields = state.fields;

  return (
    // La clé recrée les champs avec les valeurs renvoyées : Base UI refuse qu'on modifie defaultValue.
    <form key={JSON.stringify(fields)} action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">Ton prénom</Label>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={MAX_FIRST_NAME_LENGTH}
          defaultValue={fields?.firstName}
          className="h-11 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom du foyer</Label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          placeholder="La maison, Chez nous…"
          required
          maxLength={MAX_HOUSEHOLD_NAME_LENGTH}
          defaultValue={fields?.name}
          className="h-11 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultServings">Portions par défaut</Label>
        <Input
          id="defaultServings"
          name="defaultServings"
          type="number"
          inputMode="numeric"
          min={MIN_SERVINGS}
          max={MAX_SERVINGS}
          step={1}
          required
          defaultValue={fields?.defaultServings ?? DEFAULT_SERVINGS}
          aria-describedby="servings-hint"
          className="h-11 w-24 bg-white"
        />
        <p id="servings-hint" className="text-sm text-[#7A3219]/70">
          Le nombre de parts prévu pour chaque repas. Tu pourras le changer plus tard.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 bg-[#C2552D] text-white hover:bg-[#A8461F]">
        {pending ? "Création…" : "Créer mon foyer"}
      </Button>
    </form>
  );
}
