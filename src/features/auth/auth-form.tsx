"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { AuthFormState } from "./actions";
import { MIN_PASSWORD_LENGTH } from "./credentials";
import { NEXT_PARAM, withNext } from "./next-path";

type Props = {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  // "new-password" à l'inscription, "current-password" à la connexion :
  // c'est ce qui dit au gestionnaire de mots de passe d'enregistrer ou de remplir.
  passwordAutoComplete: "new-password" | "current-password";
  submitLabel: string;
  pendingLabel: string;
  // Page où aller après la connexion (#6).
  nextPath: string;
};

// Formulaire email + mot de passe, partagé par la connexion et l'inscription.
export function AuthForm({ action, passwordAutoComplete, submitLabel, pendingLabel, nextPath }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = passwordAutoComplete === "new-password";

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <input type="hidden" name={NEXT_PARAM} value={nextPath} />
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
          className="h-11 bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={isSignUp ? "password-hint" : undefined}
          className="h-11 bg-card"
        />
        {isSignUp && (
          <p id="password-hint" className="text-sm text-foreground/70">
            Au moins {MIN_PASSWORD_LENGTH} caractères.
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}{" "}
          {state.accountExists && (
            <Link href={withNext("/connexion", nextPath)} className="font-medium underline">
              Connecte-toi
            </Link>
          )}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
