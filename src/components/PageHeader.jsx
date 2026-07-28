import React from 'react'
import { supabase } from './supabaseClient'

// Barre du haut partagée par toutes les pages privées (Dashboard,
// Itineraires, VolsHebergements, ItineraireDetail, VoyageCommun,
// VoyageCommunDetail) — remplace le bloc dupliqué à l'identique dans
// chacune de ces 6 pages.
export default function PageHeader({ onFavoritesClick, onUpgradeClick, onProfileClick }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 mb-10">
      <button onClick={onFavoritesClick} className="btn-primary text-sm py-2.5 px-5">
        Mes favoris
      </button>
      <button className="btn-primary text-sm py-2.5 px-5">
        Nos ateliers
      </button>
      <button onClick={onUpgradeClick} className="btn-primary text-sm py-2.5 px-5">
        Upgrade plan
      </button>
      <button onClick={onProfileClick} className="btn-primary text-sm py-2.5 px-5">
        Modifier le profil
      </button>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-sm text-navy/60 hover:text-coral transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
