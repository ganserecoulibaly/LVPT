import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient'

const PLAN_LABELS = {
  free: 'Gratuit',
  occasional: 'Voyageur occasionnel',
  frequent: 'Grand Voyageur',
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

async function openBillingPortal(setOpeningPortal) {
  try {
    setOpeningPortal(true)
    const { data, error } = await supabase.functions.invoke('create-portal-session')

    if (error || !data?.url) {
      throw error ?? new Error('URL du portail manquante')
    }

    window.open(data.url, '_blank')
  } catch (err) {
    console.error('Erreur lors de l\'ouverture du portail de facturation :', err)
    alert("Impossible d'ouvrir la facturation pour le moment. Réessaie dans un instant.")
  } finally {
    setOpeningPortal(false)
  }
}

// Popup "Bientôt disponible" — remplace l'alerte navigateur pour rester
// cohérent avec le style des autres modales de l'app (fond blanc
// arrondi, croix de fermeture en haut à droite).
function ComingSoonModal({ onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center items-center bg-navy/45 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm relative text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2A41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <p className="font-serif text-lg text-navy mb-2">Bientôt disponible</p>
        <p className="text-sm text-navy/60 mb-6">
          Les ateliers arrivent prochainement — reviens bientôt pour découvrir cette nouveauté.
        </p>

        <button onClick={onClose} className="btn-primary w-full justify-center text-sm py-2.5">
          Compris
        </button>
      </div>
    </div>,
    document.body
  )
}

// isAdmin : "Nos ateliers" mène vers une fonctionnalité encore
// inachevée (Ateliers.jsx). Le bouton reste visible pour tout le monde
// (pour que la fonctionnalité à venir soit connue), mais affiche un
// cadenas et ouvre une popup "Bientôt disponible" au lieu de naviguer
// tant que ce n'est pas prêt — seul l'admin peut y accéder normalement.
// Défaut à false pour ne rien casser sur les pages qui n'auraient pas
// encore été mises à jour pour passer cette prop.
export default function PageHeader({ onFavoritesClick, onUpgradeClick, onProfileClick, currentPlan, isAdmin = false }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
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

  const planLabel = PLAN_LABELS[currentPlan] ?? PLAN_LABELS.free
  const hasPaidPlan = currentPlan && currentPlan !== 'free'

  const handleAteliersClick = () => {
    if (isAdmin) {
      navigate('/ateliers')
    } else {
      setComingSoonOpen(true)
    }
  }

  const items = [
    { label: 'Mes favoris', onClick: onFavoritesClick },
    { label: 'Nos ateliers', onClick: handleAteliersClick, locked: !isAdmin },
    { label: 'Upgrade plan', onClick: onUpgradeClick },
    ...(hasPaidPlan ? [{ label: openingPortal ? 'Ouverture…' : 'Facturation', onClick: () => openBillingPortal(setOpeningPortal) }] : []),
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
        <button onClick={handleAteliersClick} className="btn-primary text-sm py-2.5 px-5 relative">
          Nos ateliers
          {!isAdmin && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-navy flex items-center justify-center">
              <LockIcon />
            </span>
          )}
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
              <div className="px-4 py-2 text-xs text-navy/50 border-b border-navy/10 mb-1">
                Abonnement {planLabel}
              </div>
              {hasPaidPlan && (
                <button
                  onClick={() => { setAccountMenuOpen(false); openBillingPortal(setOpeningPortal) }}
                  disabled={openingPortal}
                  className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-navy/5 transition-colors disabled:opacity-60"
                >
                  {openingPortal ? 'Ouverture…' : 'Facturation'}
                </button>
              )}
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

      {/* Mobile : icône fixe */}
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
            <div className="px-4 py-2 text-xs text-navy/50 border-b border-navy/10 mb-1">
              Abonnement {planLabel}
            </div>
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => { setMobileMenuOpen(false); item.onClick?.() }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-navy/5 flex items-center justify-between ${
                  item.danger ? 'text-[#993C1D]' : 'text-navy'
                }`}
              >
                {item.label}
                {item.locked && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-navy flex items-center justify-center">
                    <LockIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sm:hidden h-10 mb-10" aria-hidden="true" />

      {comingSoonOpen && <ComingSoonModal onClose={() => setComingSoonOpen(false)} />}
    </>
  )
}
