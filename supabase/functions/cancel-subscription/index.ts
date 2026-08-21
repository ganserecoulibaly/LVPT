import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { stripe, corsHeaders } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

// Résilie l'abonnement Stripe de l'utilisateur connecté avec
// cancel_at_period_end: true — il garde l'accès payant jusqu'à la fin
// de la période déjà facturée (règle "tout mois commencé est dû"), puis
// stripe-webhook (customer.subscription.deleted) repasse abonnement à
// 'free' automatiquement à cette date-là.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const supabaseAdmin = createAdminClient();

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

    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        periodEnd: subscription.current_period_end, // timestamp unix (secondes)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur cancel-subscription :", error);
    return new Response(JSON.stringify({ error: "Impossible de résilier l'abonnement pour le moment" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
