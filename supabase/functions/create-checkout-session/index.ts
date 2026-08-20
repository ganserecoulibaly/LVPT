import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { stripe, corsHeaders, PRICE_IDS } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, billing } = await req.json();
    // plan attendu : "occasionnel" | "grand"
    // billing attendu : "monthly" | "yearly"

    if (!plan || !billing || !PRICE_IDS[plan]?.[billing]) {
      return new Response(JSON.stringify({ error: "plan ou billing invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client Supabase "au nom de l'utilisateur" pour identifier qui appelle
    // (le frontend doit envoyer le header Authorization avec le token de session)
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

    const priceId = PRICE_IDS[plan][billing as "monthly" | "yearly"];
    const appUrl = Deno.env.get("APP_URL")!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
