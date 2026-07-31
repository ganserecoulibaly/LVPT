import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Tip aléatoire par page — un seul affiché, pioché parmi les lignes
// actives de s_tips pour ce nomPage à chaque affichage de la page.
// Pas de carrousel, pas de mémorisation de fermeture : un ✕ masque
// juste le tip pour la visite en cours (au prochain chargement, un
// nouveau tirage aléatoire aura lieu de toute façon).
export default function TipBanner({ nomPage }) {
  const [tip, setTip] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function loadTip() {
      const { data } = await supabase
        .from('s_tips')
        .select('tips')
        .eq('nom_page', nomPage)
        .eq('actif', true)
      if (!data || data.length === 0) return
      const random = data[Math.floor(Math.random() * data.length)]
      setTip(random.tips)
    }
    loadTip()
  }, [nomPage])

  if (!tip || dismissed) return null

  return (
    <div className="bg-coral/10 rounded-xl px-4 py-3 flex items-start gap-2.5 mb-6">
      <div className="w-6 h-6 rounded-full bg-coral/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" /><path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-[#4A1B0C] mb-0.5">Astuce</p>
        <p className="text-xs text-[#712B13] leading-relaxed">{tip}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#993C1D] hover:text-[#4A1B0C] transition-colors shrink-0"
        aria-label="Masquer l'astuce"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
