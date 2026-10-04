// Les deux valeurs viennent de Supabase (Project Settings > API Keys).
// Le préfixe NEXT_PUBLIC_ les rend lisibles dans le navigateur : ce sont des clés publiques,
// la protection des données repose sur les règles RLS de la base.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Variables Supabase manquantes : renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (voir .env.example).",
    );
  }

  return { url, publishableKey };
}
