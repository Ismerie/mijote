import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

// Client Supabase pour les composants qui tournent dans le navigateur ("use client").
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
