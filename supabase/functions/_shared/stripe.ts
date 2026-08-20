import Stripe from "npm:stripe@17.4.0";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
