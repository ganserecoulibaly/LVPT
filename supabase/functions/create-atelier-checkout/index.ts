import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Paiement unique d'un atelier (tout utilisateur connecté).
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-07-29.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
});

const ALLOWED_ORIGINS = [
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

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { atelierId } = await req.json();
    if (!atelierId) return json({ error: "atelierId manquant" }, 400, cors);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Utilisateur non authentifié" }, 401, cors);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await admin
      .from("lvpt")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const { data: atelier } = await admin
      .from("d_atelier")
      .select("id_atelier, titre, stripe_price_id, actif")
      .eq("id_atelier", atelierId)
      .single();
    if (!atelier || !atelier.actif || !atelier.stripe_price_id) {
      return json({ error: "Atelier indisponible" }, 400, cors);
    }

    const appUrl = Deno.env.get("APP_URL")!;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: atelier.stripe_price_id, quantity: 1 }],
      client_reference_id: user.id,
      // Champ « code promo » affiché sur la page de paiement (tests, offres).
      allow_promotion_codes: true,
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      metadata: { type: "atelier", pid: user.id, atelier_id: atelier.id_atelier },
      success_url: `${appUrl}/ateliers/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/ateliers/${atelier.id_atelier}`,
    });

    const { error } = await admin.from("s_atelier_reservation").insert({
      pid: user.id,
      id_atelier: atelier.id_atelier,
      statut_paiement: "en_attente",
      stripe_session_id: session.id,
    });
    if (error) console.error("Insertion réservation :", error);

    return json({ url: session.url }, 200, cors);
  } catch (error) {
    console.error("Erreur create-atelier-checkout :", error);
    return json({ error: "Impossible de créer la session de paiement" }, 500, getCorsHeaders(req.headers.get("origin")));
  }
});
