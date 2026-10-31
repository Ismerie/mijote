"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createHousehold } from "../actions";
import {
  DEFAULT_PEOPLE_COUNT,
  MAX_FIRST_NAME_LENGTH,
  MAX_HOUSEHOLD_NAME_LENGTH,
  MAX_PEOPLE_COUNT,
  MIN_PEOPLE_COUNT,
} from "../household-fields";

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
          className="h-11 bg-card"
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
          className="h-11 bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="peopleCount">Nombre de personnes</Label>
        <Input
          id="peopleCount"
          name="peopleCount"
          type="number"
          inputMode="numeric"
          min={MIN_PEOPLE_COUNT}
          max={MAX_PEOPLE_COUNT}
          step={1}
          required
          defaultValue={fields?.peopleCount ?? DEFAULT_PEOPLE_COUNT}
          aria-describedby="people-count-hint"
          className="h-11 w-24 bg-card"
        />
        <p id="people-count-hint" className="text-sm text-foreground/70">
          Sert à découper chaque recette en repas. Tu pourras le changer plus tard.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Création…" : "Créer mon foyer"}
      </Button>
    </form>
  );
}
