import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@17.4.0";

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

const PLAN_MAP: Record<string, string> = {
  occasionnel: "occasional",
  grand: "frequent",
};

const PLAN_LABELS: Record<string, string> = {
  occasional: "Voyageur occasionnel",
  frequent: "Grand Voyageur",
};

// Best-effort : un échec d'envoi n'empêche jamais le changement de plan,
// juste loggé.
async function sendWelcomeToPlanEmail(toEmail: string, planLabel: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Le Voyage Pour Tous <noreply@levoyagepourtous.com>",
        to: toEmail,
        subject: `Bienvenue sur ${planLabel} !`,
        text: `Bonjour,\n\nTon abonnement ${planLabel} est maintenant actif. Tu as désormais accès à toutes les fonctionnalités de ce plan sur Le Voyage Pour Tous.\n\nBon voyage !\nL'équipe Le Voyage Pour Tous`,
      }),
    });
  } catch (emailErr) {
    console.error("Échec de l'envoi de l'email de bienvenue :", emailErr);
  }
}

// Modifie l'abonnement Stripe EXISTANT (change juste le price sur le
// même subscription item) au lieu d'en créer un nouveau via Checkout —
// évite le double abonnement / double prélèvement. proration_behavior
// laisse Stripe calculer automatiquement la différence à facturer
// (upgrade) ou le crédit à appliquer (downgrade) sur la période en
// cours.
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
      cancel_at_period_end: false,
    });

    const newAbonnement = PLAN_MAP[plan] ?? plan;

    const { error: updateError } = await supabaseAdmin
      .from("lvpt")
      .update({ abonnement: newAbonnement })
      .eq("id", user.id);

    if (updateError) {
      console.error("Erreur mise à jour lvpt (change-subscription-plan) :", updateError);
    } else if (user.email && PLAN_LABELS[newAbonnement]) {
      await sendWelcomeToPlanEmail(user.email, PLAN_LABELS[newAbonnement]);
    }

    return new Response(
      JSON.stringify({ success: true, plan: newAbonnement }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur change-subscription-plan :", error);
    return new Response(JSON.stringify({ error: "Impossible de changer de plan pour le moment" }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});