import React, { useEffect, useRef } from 'react'

// Menu "+" partagé entre Dashboard, Itineraires, VolsHebergements et
// VoyageCommun — pas de dépendance externe, fermeture au clic extérieur
// (même pattern que le menu de compte dans Navbar.jsx).
export default function QuickAddMenu({ open, onToggle, onClose, onCreateItineraire, onCreateVoyageCommun, onSearchFlights }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral/90 transition-colors"
        aria-label="Ajouter du contenu"
        title="Ajouter du contenu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-navy/10 py-1.5 z-20">
          <button
            onClick={onCreateItineraire}
            className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-navy/5 transition-colors"
          >
            Créer un itinéraire
          </button>
          <button
            onClick={onCreateVoyageCommun}
            className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-navy/5 transition-colors"
          >
            Partager un post Voyage Commun
          </button>
          <button
            onClick={onSearchFlights}
            className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-navy/5 transition-colors"
          >
            Rechercher un vol ou un hébergement
          </button>
        </div>
      )}
    </div>
  )
}
