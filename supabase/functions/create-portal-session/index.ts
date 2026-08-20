import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { stripe, corsHeaders } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

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

    // Récupère le stripe_customer_id stocké dans lvpt lors du premier paiement
    const supabaseAdmin = createAdminClient();
    const { data: lvptRow, error } = await supabaseAdmin
      .from("lvpt")
      .select("stripe_customer_id")
      .eq("pid", user.id)
      .single();

    if (error || !lvptRow?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "Aucun abonnement Stripe trouvé pour cet utilisateur" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appUrl = Deno.env.get("APP_URL")!;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: lvptRow.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur create-portal-session :", error);
    return new Response(JSON.stringify({ error: "Impossible de créer la session du portail" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
