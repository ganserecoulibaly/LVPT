// Provenance des inscrits (TikTok, Instagram, etc.) : usage interne, jamais affiché.
// 1re visite : on retient les paramètres utm_* du lien, à défaut le site d'origine.
// Stockage dans le navigateur uniquement après accord « analytics » (bandeau cookies).
import { hasAnalyticsConsent } from './CookieConsent'

const KEY = 'lvpt_attribution'

function lireUrl() {
  try {
    const p = new URLSearchParams(window.location.search)
    const source = (p.get('utm_source') || p.get('ref') || '').trim().toLowerCase()
    const medium = (p.get('utm_medium') || '').trim().toLowerCase()
    const campagne = (p.get('utm_campaign') || '').trim().toLowerCase()
    if (source) return { source, medium, campagne }
    const ref = document.referrer ? new URL(document.referrer) : null
    if (ref && ref.hostname && !ref.hostname.endsWith('levoyagepourtous.com')) {
      return { source: ref.hostname.replace(/^www\./, ''), medium: 'referrer', campagne: '' }
    }
  } catch (e) { /* on ignore */ }
  return null
}

// À appeler au chargement de l'app et après l'accord cookies : mémorise la 1re origine.
export function captureAttribution() {
  try {
    if (!hasAnalyticsConsent() || localStorage.getItem(KEY)) return
    const origine = lireUrl()
    if (origine) localStorage.setItem(KEY, JSON.stringify(origine))
  } catch (e) { /* stockage indisponible */ }
}

// Texte envoyé à l'inscription : « tiktok / bio / amsterdam », « instagram.com / referrer » ou « direct ».
export function sourceInscription() {
  let origine = null
  try {
    const stocke = hasAnalyticsConsent() ? localStorage.getItem(KEY) : null
    origine = stocke ? JSON.parse(stocke) : lireUrl()
  } catch (e) { /* on ignore */ }
  if (!origine || !origine.source) return 'direct'
  return [origine.source, origine.medium, origine.campagne].filter(Boolean).join(' / ').slice(0, 120)
}

export function sourceMemorisee() {
  try {
    const stocke = hasAnalyticsConsent() ? localStorage.getItem(KEY) : null
    if (!stocke) return null
    const o = JSON.parse(stocke)
    return o && o.source ? sourceInscription() : null
  } catch (e) { return null }
}
