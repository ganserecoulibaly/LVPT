import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@17.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-07-29.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
});

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

// Même mapping que PLAN_MAP dans stripe-webhook/index.ts — Stripe garde
// les libellés français, lvpt.abonnement stocke les valeurs anglaises
// attendues par usePlanAccess.js / Sidebar.jsx.
const PLAN_MAP: Record<string, string> = {
  occasionnel: "occasional",
  grand: "frequent",
};

// Modifie l'abonnement Stripe EXISTANT (change juste le price sur le
// même subscription item) au lieu d'en créer un nouveau via Checkout —
// évite le double abonnement / double prélèvement. proration_behavior
// laisse Stripe calculer automatiquement la différence à facturer
// (upgrade) ou le crédit à appliquer (downgrade) sur la période en
// cours.
Deno.serve(async (req) => {
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

    const { data: { user } } = await supabaseUser.auth.getUser();

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("lvpt")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "Aucun abonnement actif trouvé" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const currentItemId = subscription.items.data[0].id;
    const newPriceId = PRICE_IDS[plan][billing as "monthly" | "yearly"];

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: "create_prorations",
      // Si l'utilisateur avait programmé une résiliation puis change
      // d'avis en changeant de plan, on annule cette résiliation.
      cancel_at_period_end: false,
    });

    const newAbonnement = PLAN_MAP[plan] ?? plan;

    // Mise à jour immédiate en base pour un retour instantané côté UI.
    const { error: updateError } = await supabaseAdmin
      .from("lvpt")
      .update({ abonnement: newAbonnement })
      .eq("id", user.id);

    if (updateError) {
      console.error("Erreur mise à jour lvpt (change-subscription-plan) :", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, plan: newAbonnement }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur change-subscription-plan :", error);
    return new Response(JSON.stringify({ error: "Impossible de changer de plan pour le moment" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
