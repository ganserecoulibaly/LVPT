import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-07-29.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Domaines autorisés à appeler cette fonction depuis un navigateur.
const ALLOWED_ORIGINS = [
  "https://lvpt.gansere.com",
  "https://levoyagepourtous.com",
  "https://www.levoyagepourtous.com",
];

function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const PRICE_IDS: Record<string, Record<"monthly" | "yearly", string>> = {
  occasionnel: {
    monthly: Deno.env.get("STRIPE_PRICE_VOYAGEUR_MENSUEL")!,
    yearly: Deno.env.get("STRIPE_PRICE_VOYAGEUR_ANNUEL")!,
  },
  grand: {
    monthly: Deno.env.get("STRIPE_PRICE_GRAND_MENSUEL")!,
    yearly: Deno.env.get("STRIPE_PRICE_GRAND_ANNUEL")!,
  },
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, billing } = await req.json();

    if (!plan || !billing || !PRICE_IDS[plan]?.[billing]) {
      return new Response(JSON.stringify({ error: "plan ou billing invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Utilisateur non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: profile } = await supabaseAdmin
      .from("lvpt")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const existingCustomerId = profile?.stripe_customer_id || undefined;

    const priceId = PRICE_IDS[plan][billing as "monthly" | "yearly"];
    const appUrl = Deno.env.get("APP_URL")!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email ?? undefined }),
      metadata: {
        pid: user.id,
        plan,
        billing,
      },
      success_url: `${appUrl}/dashboard?paiement=succes`,
      cancel_url: `${appUrl}/dashboard?paiement=annule`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur create-checkout-session :", error);
    return new Response(JSON.stringify({ error: "Impossible de créer la session de paiement" }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});