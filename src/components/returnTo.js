// Mémorise la page privée demandée par un visiteur non connecté (typiquement
// un lien partagé /voyage-commun/:id), pour l'y ramener après connexion ou
// inscription. localStorage plutôt que sessionStorage : l'inscription par
// e-mail passe par un lien de confirmation qui s'ouvre dans un autre onglet.
// Tout est protégé par try/catch (stockage parfois indisponible) et expire
// au bout de 24 h.
const KEY = 'lvpt_return_to'
const TTL_MS = 24 * 60 * 60 * 1000

// Seuls les liens partageables sont mémorisés, pas n'importe quelle page.
export function isShareablePath(path) {
  return /^\/(voyage-commun|itineraires)\/[^/]+$/.test(path)
}

export function saveReturnTo(path) {
  try {
    if (!isShareablePath(path)) return
    localStorage.setItem(KEY, JSON.stringify({ path, ts: Date.now() }))
  } catch { /* ignoré */ }
}

// Renvoie le chemin mémorisé (et l'efface), ou null s'il n'y en a pas / s'il a expiré.
export function consumeReturnTo() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    localStorage.removeItem(KEY)
    const { path, ts } = JSON.parse(raw)
    if (!isShareablePath(path) || Date.now() - ts > TTL_MS) return null
    return path
  } catch {
    return null
  }
}
