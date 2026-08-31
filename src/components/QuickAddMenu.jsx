import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Icônes en ligne, mêmes tracés que ceux déjà utilisés ailleurs dans
// l'app (Sidebar.jsx) pour rester visuellement cohérent.
const icons = {
  route: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a4 4 0 0 0 4-4 4 4 0 0 0-4-4H9a4 4 0 0 1-4-4 4 4 0 0 1 4-4h7" />
    </svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  plane: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 2.7 5.9c.3.7 1.2.8 1.7.3l.8-.7c.4-.3.6-.8.5-1.3z" />
    </svg>
  ),
  music: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  kitchen: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h1a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  mapPin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  wallet: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  lock: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
}

const PLAN_ORDER = ['free', 'occasional', 'frequent']

function isUnlocked(requiredPlan, currentPlan) {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan)
}

// Chaque entrée : requiredPlan pour le verrouillage (même logique que
// Sidebar.jsx). action distingue "modal" (ouvre une modale sans quitter
// le Dashboard) de "navigate" (redirige vers la page). Séjours n'a pas
// d'entrée : aucun formulaire de création n'existe côté utilisateur,
// c'est un catalogue géré uniquement par l'admin via AdminOffres.
const ITEMS = [
  { id: 'itineraire', label: 'Créer un itinéraire', icon: 'route', requiredPlan: 'free', action: 'itineraire' },
  { id: 'voyage_commun', label: 'Partager un post Voyage Commun', icon: 'users', requiredPlan: 'free', action: 'voyage_commun' },
  { id: 'flights', label: 'Rechercher un vol ou un hébergement', icon: 'plane', requiredPlan: 'free', action: 'flights' },
  { id: 'depenses', label: 'Ajouter une dépense', icon: 'wallet', requiredPlan: 'occasional', action: 'depenses' },
  { id: 'playlist', label: 'Ajouter une musique', icon: 'music', requiredPlan: 'occasional', action: 'playlist' },
  { id: 'gastronomie', label: 'Ajouter un plat', icon: 'kitchen', requiredPlan: 'occasional', action: 'gastronomie' },
  { id: 'activites', label: 'Ajouter une activité', icon: 'mapPin', requiredPlan: 'frequent', action: 'activites' },
]

// Menu "+" partagé entre Dashboard, Itineraires, VolsHebergements et
// VoyageCommun — pas de dépendance externe, fermeture au clic extérieur
// (même pattern que le menu de compte dans Navbar.jsx).
//
// Le popup est positionné en `fixed` et centré horizontalement par
// rapport à l'ÉCRAN entier (pas relatif au bouton) sur mobile — un
// positionnement relatif au bouton (absolute left-0/right-0) débordait
// systématiquement du viewport selon l'endroit où le bouton "+" est
// affiché sur la page. Sur desktop (sm:), on repasse à un positionnement
// classique ancré sous le bouton, où il y a assez de place.
//
// currentPlan / isAdmin : contrôlent le verrouillage des options, comme
// dans Sidebar.jsx — un admin voit toujours tout débloqué. onLockedClick
// est appelé quand une option verrouillée est cliquée (ouvre PricingModal
// côté page appelante, même pattern que Sidebar).
export default function QuickAddMenu({
  open,
  onToggle,
  onClose,
  onCreateItineraire,
  onCreateVoyageCommun,
  onSearchFlights,
  onAddDepense,
  onAddMusique,
  onAddPlat,
  onAddLieu,
  currentPlan = 'free',
  isAdmin = false,
  onLockedClick,
}) {
  const ref = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      const clickedButton = ref.current && ref.current.contains(e.target)
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target)
      if (!clickedButton && !clickedMenu) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  function resolveAction(item) {
    const unlocked = isAdmin || isUnlocked(item.requiredPlan, currentPlan)
    if (!unlocked) {
      onLockedClick?.()
      onClose()
      return
    }

    onClose()

    switch (item.action) {
      case 'itineraire':
        onCreateItineraire?.()
        break
      case 'voyage_commun':
        onCreateVoyageCommun?.()
        break
      case 'flights':
        onSearchFlights?.()
        break
      case 'depenses':
        if (onAddDepense) onAddDepense()
        else navigate('/depenses')
        break
      case 'playlist':
        onAddMusique?.()
        break
      case 'gastronomie':
        onAddPlat?.()
        break
      case 'activites':
        onAddLieu?.()
        break
      default:
        break
    }
  }

  function renderItems() {
    return ITEMS.map((item) => {
      const unlocked = isAdmin || isUnlocked(item.requiredPlan, currentPlan)
      return (
        <button
          key={item.id}
          onClick={() => resolveAction(item)}
          className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm hover:bg-navy/5 transition-colors"
        >
          <span className={unlocked ? 'text-navy/60 shrink-0' : 'text-navy/25 shrink-0'}>
            {icons[item.icon]}
          </span>
          <span className={unlocked ? 'text-navy flex-1' : 'text-navy/40 flex-1'}>
            {item.label}
          </span>
          {!unlocked && (
            <span className="shrink-0 w-4 h-4 rounded-full bg-navy flex items-center justify-center">
              {icons.lock}
            </span>
          )}
        </button>
      )
    })
  }

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
        <>
          <div
            ref={menuRef}
            className="sm:hidden fixed left-1/2 -translate-x-1/2 top-24 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-lg border border-navy/10 py-1.5 z-50"
          >
            {renderItems()}
          </div>

          <div className="hidden sm:block absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-navy/10 py-1.5 z-20">
            {renderItems()}
          </div>
        </>
      )}
    </div>
  )
}
