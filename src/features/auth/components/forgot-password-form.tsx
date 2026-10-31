"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset } from "../actions";

// Demande d'un lien de réinitialisation par email (#43).
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});

  if (state.sent) {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <p role="status" className="text-balance">
          Si un compte existe pour cette adresse, un lien pour choisir un nouveau mot de passe vient d&apos;être envoyé.
          Pense à vérifier tes spams.
        </p>
        <Link href="/connexion" className="font-medium underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        {/* La clé recrée le champ quand l'email renvoyé change : Base UI refuse qu'on modifie defaultValue. */}
        <Input
          key={state.email}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          className="h-11 bg-white"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 bg-[#C2552D] text-white hover:bg-[#A8461F]">
        {pending ? "Envoi…" : "Recevoir le lien"}
      </Button>
    </form>
  );
}
