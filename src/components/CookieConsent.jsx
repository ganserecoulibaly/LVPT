import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'lvpt_cookie_consent'
const OPEN_SETTINGS_EVENT = 'lvpt:open-cookie-settings'

// Préfixes des cookies déposés par les outils de mesure (Google Analytics,
// Hotjar). Ils sont supprimés quand le visiteur retire son consentement.
const ANALYTICS_COOKIE_PREFIXES = ['_ga', '_gid', '_gat', '_hj']

// Le consentement analytics est partagé avec AnalyticsTracker. Les outils
// de mesure ne doivent être chargés qu'après un choix explicite "accepted".
export function hasAnalyticsConsent() {
  return localStorage.getItem(STORAGE_KEY) === 'accepted'
}

// Réaffiche le bandeau pour permettre au visiteur de modifier son choix
// (lien "Gérer les cookies" du footer, page Cookies). Exigence CNIL : retirer
// son consentement doit être aussi simple que le donner.
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))
}

function deleteAnalyticsCookies() {
  const hostname = window.location.hostname
  const domains = ['', hostname, `.${hostname}`, `.${hostname.replace(/^www\./, '')}`]

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (!ANALYTICS_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) return

    domains.forEach((domain) => {
      const domainPart = domain ? `; domain=${domain}` : ''
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`
    })
  })
}

export default function CookieConsent() {
  const [choice, setChoice] = useState(() => localStorage.getItem(STORAGE_KEY))

  useEffect(() => {
    const handleOpen = () => setChoice(null)
    window.addEventListener(OPEN_SETTINGS_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, handleOpen)
  }, [])

  const respond = (value) => {
    const previous = localStorage.getItem(STORAGE_KEY)
    localStorage.setItem(STORAGE_KEY, value)
    setChoice(value)

    if (value === 'accepted') {
      window.dispatchEvent(new Event('lvpt:analytics-consent'))
      return
    }

    // Retrait du consentement : on efface les cookies de mesure et on
    // recharge la page pour décharger les scripts déjà actifs.
    if (previous === 'accepted') {
      deleteAnalyticsCookies()
      window.location.reload()
    }
  }

  if (choice) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-navy text-white px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-xs text-white/80 leading-relaxed flex-1">
          On utilise des cookies strictement nécessaires au fonctionnement du
          site (connexion, sécurité). Avec ton accord, on pourra aussi
          mesurer l'audience pour améliorer le site — jamais de publicité
          ciblée. Tu peux changer d'avis à tout moment via « Gérer les cookies »
          en bas de page. Détails dans notre{' '}
          <a href="/confidentialite" className="underline hover:text-coral transition-colors">
            politique de confidentialité
          </a>.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => respond('refused')}
            className="text-xs text-white/70 hover:text-white transition-colors px-3 py-2"
          >
            Refuser
          </button>
          <button
            onClick={() => respond('accepted')}
            className="bg-coral text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-coral/90 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
