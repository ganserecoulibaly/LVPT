import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Barre du haut partagée par toutes les pages privées (Dashboard,
// Itineraires, VolsHebergements, ItineraireDetail, VoyageCommun,
// VoyageCommunDetail) — remplace le bloc dupliqué à l'identique dans
// chacune de ces 6 pages.
//
// Sur mobile, les 5 pastilles ne tenaient jamais sur une ligne et
// retombaient en plusieurs lignes mal alignées (flex-wrap) — remplacé
// par un menu compact (une seule icône "•••") en dessous du breakpoint
// sm. Le rendu desktop (pastilles en ligne) reste inchangé.
export default function PageHeader({ onFavoritesClick, onUpgradeClick, onProfileClick }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const accountMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileMenuOpen(false)
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) setAccountMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const items = [
    { label: 'Mes favoris', onClick: onFavoritesClick },
    { label: 'Nos ateliers', onClick: () => navigate('/ateliers') },
    { label: 'Upgrade plan', onClick: onUpgradeClick },
    { label: 'Modifier le profil', onClick: onProfileClick },
    { label: 'Se déconnecter', onClick: () => supabase.auth.signOut(), danger: true },
  ]

  return (
    <>
      {/* Desktop / tablette : pastilles en ligne, inchangé */}
      <div className="hidden sm:flex flex-wrap items-center justify-end gap-3 mb-10">
        <button onClick={onFavoritesClick} className="btn-primary text-sm py-2.5 px-5">
          Mes favoris
        </button>
        <button onClick={() => navigate('/ateliers')} className="btn-primary text-sm py-2.5 px-5">
          Nos ateliers
        </button>
        <button onClick={onUpgradeClick} className="btn-primary text-sm py-2.5 px-5">
          Upgrade plan
        </button>
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setAccountMenuOpen((o) => !o)}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1.5"
          >
            Mon compte
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {accountMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-navy/10 py-1.5 overflow-hidden z-10">
              <button
                onClick={() => { setAccountMenuOpen(false); onProfileClick?.() }}
                className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-navy/5 transition-colors"
              >
                Modifier le profil
              </button>
              <button
                onClick={() => { setAccountMenuOpen(false); supabase.auth.signOut() }}
                className="w-full text-left px-4 py-2.5 text-sm text-[#993C1D] hover:bg-navy/5 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile : icône fixe, alignée avec le hamburger de Sidebar (même
          top-4) plutôt que dans le flux normal de la page — sinon le
          padding-top de la page la décale plus bas que le hamburger. */}
      <div className="sm:hidden fixed top-4 right-4 z-40" ref={menuRef}>
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center shadow-sm"
          aria-label="Menu du compte"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {mobileMenuOpen && (
          <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-navy/10 py-1.5">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => { setMobileMenuOpen(false); item.onClick?.() }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-navy/5 ${
                  item.danger ? 'text-[#993C1D]' : 'text-navy'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Espace invisible, mobile uniquement : le bouton ci-dessus est en
          fixed (pour s'aligner avec le hamburger de Sidebar), donc il ne
          pousse plus rien vers le bas tout seul — sans ça, le contenu de
          la page remonte et vient se superposer aux boutons fixes. */}
      <div className="sm:hidden h-10 mb-10" aria-hidden="true" />
    </>
  )
}
