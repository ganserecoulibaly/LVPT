import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const PLAN_LABELS = {
  free: 'Gratuit',
  occasionnel: 'Voyageur occasionnel',
  grand: 'Grand Voyageur',
}

export default function PageHeader({ onFavoritesClick, onUpgradeClick, onProfileClick }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
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

  // Récupère le plan actuel de l'utilisateur connecté
  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('lvpt')
        .select('abonnement')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setCurrentPlan(data.abonnement)
      }
    }
    fetchPlan()
  }, [])

  const planLabel = PLAN_LABELS[currentPlan] ?? PLAN_LABELS.free

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
              <div className="px-4 py-2 text-xs text-navy/50 border-b border-navy/10 mb-1">
                Abonnement {planLabel}
              </div>
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

      <div className="sm:hidden h-10 mb-10" aria-hidden="true" />
    </>
  )
}