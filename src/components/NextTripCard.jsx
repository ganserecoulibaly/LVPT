import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { formatDate, daysUntil } from './dateUtils'

export default function NextTripCard() {
  const [vol, setVol] = useState(null)
  const [hebergement, setHebergement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrip() {
      // RLS restreint déjà ces requêtes aux lignes de l'utilisateur connecté
      const [{ data: volData }, { data: hebData }] = await Promise.all([
        supabase.from('s_vol').select('*').eq('primary_vol', true).maybeSingle(),
        supabase.from('s_hebergement').select('*').eq('primary_hebergement', true).maybeSingle(),
      ])
      setVol(volData)
      setHebergement(hebData)
      setLoading(false)
    }
    loadTrip()
  }, [])

  if (loading) return null

  if (!vol) {
    return (
      <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-navy/5 text-center">
        <p className="text-sm text-navy/60">
          Aucun voyage prévu pour l'instant — direction "Vols & hébergements" pour choisir le tien.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#D85A30] to-[#8B2F1A] text-white p-6 sm:p-8 mb-8 relative">
      <p className="text-xs uppercase tracking-wider text-white/70 mb-2">Prochain voyage</p>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-serif text-2xl sm:text-3xl mb-1">{vol.aeroport_arrivee}</p>
          <p className="text-sm text-white/80">
            {formatDate(vol.date_depart)} → {formatDate(vol.date_arrivee)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-3xl font-serif">{daysUntil(vol.date_depart)}</p>
          <p className="text-xs text-white/70">jours restants</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
        <span className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white/20">
          ✓ Billets réservés
        </span>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
          hebergement ? 'bg-white/20' : 'bg-white/10 text-white/60'
        }`}>
          {hebergement ? '✓' : '○'} Hébergement {hebergement ? 'réservé' : 'à réserver'}
        </span>
      </div>
    </div>
  )
}
