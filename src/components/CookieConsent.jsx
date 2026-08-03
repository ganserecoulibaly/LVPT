import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'lvpt_cookie_consent'

// Bandeau de consentement cookies, affiché une seule fois tant que le
// user n'a pas fait de choix. "Refuser" ne bloque rien aujourd'hui côté
// technique (le site n'a pas encore d'outil analytics/publicitaire),
// mais pose l'infrastructure : le jour où un outil de mesure est ajouté
// (ex: Google Analytics, Meta Pixel), son chargement doit être conditionné
// à `hasAnalyticsConsent()` plutôt que chargé sans condition.
export function hasAnalyticsConsent() {
  return localStorage.getItem(STORAGE_KEY) === 'accepted'
}

export default function CookieConsent() {
  const [choice, setChoice] = useState(() => localStorage.getItem(STORAGE_KEY))

  const respond = (value) => {
    localStorage.setItem(STORAGE_KEY, value)
    setChoice(value)
  }

  if (choice) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-navy text-white px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-xs text-white/80 leading-relaxed flex-1">
          On utilise des cookies strictement nécessaires au fonctionnement du
          site (connexion, sécurité). Avec ton accord, on pourra aussi
          mesurer l'audience pour améliorer le site — jamais de publicité
          ciblée. Détails dans notre{' '}
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
