"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { readCredentials, readEmail, validateCredentials, validateEmail, validatePassword } from "./credentials";
import { NEXT_PARAM, safeNextPath } from "./next-path";

export type AuthFormState = {
  error?: string;
  // Vrai quand l'email est déjà utilisé : le formulaire propose alors de se connecter.
  accountExists?: boolean;
  email?: string;
};

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = readCredentials(formData);
  const invalid = validateCredentials(credentials);
  if (invalid) return { error: invalid, email: credentials.email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(credentials);

  if (error?.code === "user_already_exists" || error?.code === "email_exists") {
    return {
      error: "Un compte existe déjà avec cet email.",
      accountExists: true,
      email: credentials.email,
    };
  }
  if (error?.code === "weak_password") {
    return { error: "Ce mot de passe est trop faible, choisis-en un autre.", email: credentials.email };
  }
  if (error) {
    return { error: "La création du compte a échoué, réessaie dans un instant.", email: credentials.email };
  }

  // La confirmation par email est désactivée en V1 (#16) : le compte est connecté tout de suite.
  redirect(safeNextPath(formData.get(NEXT_PARAM)));
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Saisis ton email et ton mot de passe.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.code === "invalid_credentials") {
    // Même message que l'email ou le mot de passe soit faux, pour ne pas révéler qui a un compte.
    return { error: "Email ou mot de passe incorrect.", email };
  }
  if (error) {
    return { error: "La connexion a échoué, réessaie dans un instant.", email };
  }

  // Retour à la page demandée avant la connexion (#6), l'accueil sinon.
  redirect(safeNextPath(formData.get(NEXT_PARAM)));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export type ResetRequestState = {
  error?: string;
  sent?: boolean;
  email?: string;
};

// Envoie le lien de réinitialisation. Le message de succès est le même que l'email existe ou non (#43).
export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = readEmail(formData);
  const invalid = validateEmail(email);
  if (invalid) return { error: invalid, email };

  // Le lien doit revenir sur le même site que celui où la personne se trouve (local, téléphone, production).
  const origin = (await headers()).get("origin");
  if (!origin) return { error: "Le lien n'a pas pu être préparé, réessaie dans un instant.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Un email vient d'être envoyé. Attends une minute avant d'en demander un autre.", email };
  }
  if (error) {
    return { error: "L'envoi a échoué, réessaie dans un instant.", email };
  }

  return { sent: true, email };
}

export type NewPasswordState = {
  error?: string;
};

// Remplace le mot de passe de la personne connectée par le lien de réinitialisation (#43).
export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const invalid = validatePassword(password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error?.code === "same_password") {
    return { error: "Choisis un mot de passe différent de l'ancien." };
  }
  if (error?.code === "weak_password") {
    return { error: "Ce mot de passe est trop faible, choisis-en un autre." };
  }
  if (error) {
    return { error: "Le changement a échoué, réessaie dans un instant." };
  }

  redirect("/");
}
