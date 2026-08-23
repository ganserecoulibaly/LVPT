import Stripe from "npm:stripe@17.4.0";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-07-29.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Domaines autorisés à appeler ces fonctions depuis un navigateur — le
// domaine de prod actuel plus le futur domaine (transition en cours).
const ALLOWED_ORIGINS = [
  "https://lvpt.gansere.com",
  "https://levoyagepourtous.com",
  "https://www.levoyagepourtous.com",
];

export function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Les 4 Price ID, renseignés via les secrets Supabase (voir .env.example plus bas)
export const PRICE_IDS: Record<string, Record<"monthly" | "yearly", string>> = {
  occasionnel: {
    monthly: Deno.env.get("STRIPE_PRICE_VOYAGEUR_MENSUEL")!,
    yearly: Deno.env.get("STRIPE_PRICE_VOYAGEUR_ANNUEL")!,
  },
  grand: {
    monthly: Deno.env.get("STRIPE_PRICE_GRAND_MENSUEL")!,
    yearly: Deno.env.get("STRIPE_PRICE_GRAND_ANNUEL")!,
  },
};