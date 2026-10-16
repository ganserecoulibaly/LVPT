// Aperçu de lien (WhatsApp, X, Facebook, Telegram…) pour un post du Comptoir.
//
// Les robots de ces applis ne lancent pas le JavaScript : ils liraient le
// index.html générique du site. vercel.json les redirige donc ici (selon
// leur User-Agent) pour obtenir un petit HTML avec les balises Open Graph
// du post. Les vrais visiteurs, eux, reçoivent l'application normalement.
//
// On n'expose qu'un teaser (titre, type, lieu) : la description complète
// reste réservée aux inscrits. Aucune photo : on utilise l'image du site.

const ORIGIN = 'https://levoyagepourtous.com'
const IMAGE = `${ORIGIN}/og-image.jpg`
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchTeaser(id) {
  const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!base || !key || !UUID.test(id)) return null

  const endpoint =
    `${base}/rest/v1/s_voyage_commun?id_post=eq.${id}` +
    '&select=titre,pays,ville,voyage_commun_categorie(nom)&limit=1'
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(4000),
  })
  if (!response.ok) return null
  const rows = await response.json()
  return rows && rows[0] ? rows[0] : null
}

export function buildDescription(post) {
  const type = post?.voyage_commun_categorie?.nom || 'Post'
  let lieu
  if (!post?.pays || post.pays === 'Monde') lieu = 'valable dans tous les pays'
  else lieu = post.ville ? `${post.ville}, ${post.pays}` : post.pays
  return `${type} · ${lieu}. Partagé par la communauté Le Voyage Pour Tous : inscris-toi gratuitement pour lire la suite.`
}

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  const url = `${ORIGIN}/voyage-commun/${encodeURIComponent(id)}`

  let post = null
  try {
    post = await fetchTeaser(id)
  } catch (err) {
    console.error('Aperçu de post : lecture impossible', err)
  }

  const title = post?.titre
    ? `${post.titre} — Le Voyage Pour Tous`
    : 'Carnet de voyage gratuit et complet — Le Voyage Pour Tous'
  const description = post
    ? buildDescription(post)
    : 'Bons plans, conseils et alertes partagés par la communauté Le Voyage Pour Tous.'

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="Le Voyage Pour Tous">
<meta property="og:type" content="article">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${IMAGE}">
</head>
<body>
<p><a href="${esc(url)}">${esc(title)}</a></p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Mis en cache côté Vercel : un post très partagé ne sollicite pas la base à chaque aperçu.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(html)
}
