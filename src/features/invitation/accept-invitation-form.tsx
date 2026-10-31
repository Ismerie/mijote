"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_FIRST_NAME_LENGTH } from "@/features/household/household-fields";

import { acceptInvitation } from "./actions";

export function AcceptInvitationForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitation, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <input type="hidden" name="code" value={code} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">Ton prénom</Label>
        {/* La clé recrée le champ quand le prénom renvoyé change : Base UI refuse qu'on modifie defaultValue. */}
        <Input
          key={state.firstName}
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={MAX_FIRST_NAME_LENGTH}
          defaultValue={state.firstName}
          className="h-11 bg-card"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Un instant…" : "Rejoindre le foyer"}
      </Button>
    </form>
  );
}
