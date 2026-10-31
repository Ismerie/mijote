import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Statut · Mijote",
  robots: { index: false },
};

// Page de vérification de J1 (#3) : affiche une valeur lue dans la base Supabase.
export default async function StatutPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("statut_app")
    .select("valeur")
    .eq("cle", "message")
    .maybeSingle();

  const ok = !error && data !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">Base de données</h1>
      {ok ? (
        <p className="max-w-xs text-balance">✅ {data.valeur}</p>
      ) : (
        <p className="max-w-xs text-balance">
          ❌ Lecture impossible : {error?.message ?? "la valeur attendue est absente."}
        </p>
      )}
    </main>
  );
}
