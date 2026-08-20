import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Client avec la clé service_role : ne l'utilise QUE côté Edge Function,
// jamais côté frontend. Il permet de modifier la table lvpt sans passer
// par les policies RLS de l'utilisateur.
export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
