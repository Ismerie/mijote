"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updatePassword } from "../actions";
import { MIN_PASSWORD_LENGTH } from "../credentials";

// Choix du nouveau mot de passe, après le lien reçu par email (#43).
export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby="password-hint"
          aria-invalid={state.error ? true : undefined}
          className="h-11 bg-white"
        />
        <p id="password-hint" className="text-sm text-[#7A3219]/70">
          Au moins {MIN_PASSWORD_LENGTH} caractères.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 bg-[#C2552D] text-white hover:bg-[#A8461F]">
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
