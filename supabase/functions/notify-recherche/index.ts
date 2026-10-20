// Notification ntfy (topic lvpt-business) quand quelqu'un envoie le
// formulaire « vol » ou « hébergement » (accueil, Dashboard, Vols & hébergements).
// Appelée par le navigateur APRÈS l'envoi réussi à Web3Forms. Les visiteurs de
// l'accueil n'ont pas de compte : la fonction est donc publique (verify_jwt: false),
// d'où la validation stricte et la limite d'envois ci-dessous.

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

// Limite simple par adresse IP (mémoire de l'instance : freine les rafales,
// sans prétendre arrêter un attaquant déterminé).
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5; // 5 demandes / 10 minutes / IP
}

// Texte court, sans retours à la ligne, tronqué.
function clean(value: unknown, max = 80): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

const SOURCES: Record<string, string> = {
  accueil: "Accueil (visiteur)",
  dashboard: "Dashboard (connecté)",
  "vols-hebergements": "Vols & hébergements (connecté)",
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405, cors);

  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "inconnue").split(",")[0].trim();
    if (tooMany(ip)) return json({ error: "Trop de demandes" }, 429, cors);

    const b = await req.json();
    const type = b?.type === "hebergements" ? "hebergements" : b?.type === "vols" ? "vols" : null;
    if (!type) return json({ error: "Type invalide" }, 400, cors);

    const email = clean(b.email, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail invalide" }, 400, cors);

    const nom = [clean(b.prenom, 40), clean(b.nom, 40)].filter(Boolean).join(" ") || "Nom inconnu";
    const source = SOURCES[clean(b.source, 30)] ?? "Source inconnue";
    const voyageurs = `${clean(b.adultes, 3) || "?"} adulte(s)${Number(b.enfants) > 0 ? `, ${clean(b.enfants, 3)} enfant(s)` : ""}`;
    const dates = `${clean(b.aller, 10)} → ${clean(b.retour, 10)}`;

    const lignes = type === "vols"
      ? [`${clean(b.origine)} → ${clean(b.destination)}`, dates, voyageurs]
      : [
          clean(b.destination),
          dates,
          voyageurs,
          `Budget max : ${clean(b.budget, 8) || "?"} €/nuit`,
          clean(b.typeHebergement) ? `Type : ${clean(b.typeHebergement)}` : "",
        ];

    const message = [
      `${nom} (${email})`,
      ...lignes,
      `Source : ${source}`,
    ].filter(Boolean).join("\n");

    const baseUrl = Deno.env.get("NTFY_URL");
    const token = Deno.env.get("NTFY_TOKEN");
    if (!baseUrl || !token) return json({ ok: true, notified: false }, 200, cors);

    const res = await fetch(baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "lvpt-business",
        title: type === "vols" ? "Recherche de vol" : "Recherche d'hébergement",
        message,
        priority: 3,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("ntfy a répondu", res.status);

    return json({ ok: true, notified: res.ok }, 200, cors);
  } catch (error) {
    console.error("Erreur notify-recherche :", error);
    return json({ error: "Erreur" }, 500, cors);
  }
});
