import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Appelée par la page de confirmation quand l'acheteur a choisi sa date
// dans Calendly. Vérifie que la réservation est bien payée et appartient
// à l'appelant, l'enregistre, puis notifie l'admin (ntfy lvpt-business).
// Si le secret CALENDLY_TOKEN existe, la date exacte est lue chez Calendly.
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

async function notifyAdmin(topic: string, title: string, message: string) {
  const baseUrl = Deno.env.get("NTFY_URL");
  const token = Deno.env.get("NTFY_TOKEN");
  if (!baseUrl || !token) return;
  try {
    await fetch(baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ topic, title, message, priority: 3 }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("Échec ntfy :", err);
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { sessionId, eventUri } = await req.json();
    if (!sessionId) return json({ error: "sessionId manquant" }, 400, cors);

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

    const { data: resa } = await admin
      .from("s_atelier_reservation")
      .select("id_reservation, pid, statut_paiement, date_choisie_le, id_atelier")
      .eq("stripe_session_id", sessionId)
      .single();
    if (!resa || resa.pid !== user.id || resa.statut_paiement !== "paye") {
      return json({ error: "Réservation introuvable ou non payée" }, 403, cors);
    }
    if (resa.date_choisie_le) return json({ ok: true, deja: true }, 200, cors);

    // Date exacte via l'API Calendly (facultatif)
    let startTime: string | null = null;
    const calToken = Deno.env.get("CALENDLY_TOKEN");
    if (calToken && typeof eventUri === "string" && eventUri.startsWith("https://api.calendly.com/")) {
      try {
        const r = await fetch(eventUri, { headers: { Authorization: `Bearer ${calToken}` } });
        if (r.ok) startTime = (await r.json())?.resource?.start_time ?? null;
      } catch (err) {
        console.warn("Calendly injoignable :", err);
      }
    }

    await admin
      .from("s_atelier_reservation")
      .update({
        calendly_event_uri: typeof eventUri === "string" ? eventUri : null,
        date_atelier: startTime,
        date_choisie_le: new Date().toISOString(),
      })
      .eq("id_reservation", resa.id_reservation);

    const [{ data: atelier }, { data: person }] = await Promise.all([
      admin.from("d_atelier").select("titre").eq("id_atelier", resa.id_atelier).single(),
      admin.from("lvpt").select("prenom, nom, email").eq("id", user.id).single(),
    ]);
    const name = [person?.prenom, person?.nom].filter(Boolean).join(" ");
    const who = name && person?.email ? `${name} (${person.email})` : name || person?.email || user.email || "Utilisateur";
    const when = startTime
      ? new Date(startTime).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short" })
      : "date visible dans Calendly";

    await notifyAdmin(
      "lvpt-business",
      "Atelier : date choisie",
      `${who}\n${atelier?.titre ?? "Atelier"}\n${when}`
    );

    return json({ ok: true }, 200, cors);
  } catch (error) {
    console.error("Erreur atelier-date-choisie :", error);
    return json({ error: "Erreur" }, 500, getCorsHeaders(req.headers.get("origin")));
  }
});
