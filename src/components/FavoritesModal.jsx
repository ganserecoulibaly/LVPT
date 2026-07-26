import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import DealCard from './DealCard'

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'vol', label: 'Vols' },
  { id: 'hebergement', label: 'Hébergements' },
  { id: 'activite', label: 'Activités' },
  { id: 'itineraire', label: 'Itinéraires' },
  { id: 'voyage_commun', label: 'Voyage commun' },
]

export default function FavoritesModal({ onClose, favoriteDeals, userId, favoriteIds, onToggleFavorite }) {
  const [filter, setFilter] = useState('all')

  const filteredDeals =
    filter === 'all'
      ? favoriteDeals
      : favoriteDeals.filter((deal) => deal.type === filter)

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-3xl relative m-auto"
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

        <p className="font-serif text-lg text-navy mb-1">Mes favoris</p>
        <p className="text-sm text-navy/55 mb-5">
          Retrouve ici les bons plans que tu as mis de côté.
        </p>

        {favoriteDeals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === f.id
                    ? 'bg-navy text-white border-navy'
                    : 'border-navy/15 text-navy/60 hover:bg-navy/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {favoriteDeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-navy/50">
              Aucun favori pour l'instant — clique sur le ♥ d'une carte pour l'ajouter ici.
            </p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-navy/50">
              Aucun favori dans cette catégorie pour l'instant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                userId={userId}
                isFavorite={favoriteIds.has(`${deal.type}:${deal.id}`)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
