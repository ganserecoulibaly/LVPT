import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Icônes en ligne, dans le même style que le reste de l'app (pas de dépendance externe)
const icons = {
  plane: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 2.7 5.9c.3.7 1.2.8 1.7.3l.8-.7c.4-.3.6-.8.5-1.3z"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  route: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2"/>
      <circle cx="18" cy="5" r="2"/>
      <path d="M8 19h7a4 4 0 0 0 4-4 4 4 0 0 0-4-4H9a4 4 0 0 1-4-4 4 4 0 0 1 4-4h7"/>
    </svg>
  ),
  suitcase: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  kitchen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h1a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  ),
  wallet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  music: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  bed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16"/>
      <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
      <path d="M2 17h20"/>
      <path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  fileText: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
      <path d="M14 2v6h6"/>
      <path d="M16 13H8"/>
      <path d="M16 17H8"/>
      <path d="M10 9H8"/>
    </svg>
  ),
  toolbox: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2"/>
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
      <path d="M2 13h20"/>
      <path d="M9 13v2"/>
      <path d="M15 13v2"/>
    </svg>
  ),
  chevron: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  language: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h7"/><path d="M9 3v2c0 4.4-2.7 8-6 8"/><path d="M5 9c0 2.5 2.3 4.5 6 5"/>
      <path d="M14 20l4-9 4 9"/><path d="M15.5 17h5"/>
    </svg>
  ),
  currency: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 8h4a2 2 0 0 1 0 4H9m0 0h4a2 2 0 0 1 0 4H9m2-12v12"/>
    </svg>
  ),
  lock: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  clipboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" /><path d="M9 16h6" />
    </svg>
  ),
}

// À remplacer plus tard par le vrai plan de l'utilisateur (récupéré depuis Supabase)
// une fois le modèle de données abonnements/permissions en place.
const PLAN_ORDER = ['free', 'occasional', 'frequent']

function isUnlocked(requiredPlan, currentPlan) {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan)
}

// TODO : remplacer par le vrai nombre de nouveaux éléments ajoutés depuis
// la dernière visite de l'utilisateur (comparer content.created_at à
// user_module_views.last_seen_at côté Supabase).
const NEW_CONTENT_COUNTS = {
  flights: 3,
  sejours: 2,
  itineraries: 1,
}

const MODULES = [
  { id: 'flights', name: 'Vols & hébergements', icon: 'plane', requiredPlan: 'free', path: '/vols-hebergements' },
  { id: 'group', name: 'Voyage commun', icon: 'users', requiredPlan: 'free', path: '/voyage-commun' },
  { id: 'sejours', name: 'Séjours', icon: 'suitcase', requiredPlan: 'occasional', path: '/sejours' },
  { id: 'itineraries', name: 'Itinéraires de vacances', icon: 'route', requiredPlan: 'free', path: '/itineraires' },
  { id: 'expenses', name: 'Journal de dépenses', icon: 'wallet', requiredPlan: 'occasional', path: '/depenses' },
  { id: 'playlist', name: 'Playlist du voyage', icon: 'music', requiredPlan: 'occasional', path: '/playlist' },
  { id: 'food', name: 'Carnet gastronomique', icon: 'kitchen', requiredPlan: 'occasional', path: '/carnet-gastronomique' },
  { id: 'activities', name: 'Activités & musées', icon: 'mapPin', requiredPlan: 'frequent', path: '/activites' },
  { id: 'stays', name: "Carnet d'hébergements", icon: 'bed', requiredPlan: 'frequent', path: '/hebergements' },
  { id: 'documents', name: 'Documents de transport', icon: 'fileText', requiredPlan: 'frequent', path: '/documents' },
]

const SEEN_STORAGE_KEY = 'lvpt_seen_modules'
const LAST_VISIT_FLIGHTS_KEY_PREFIX = 'lvpt_last_visit_flights_'

function getLastFlightsVisit(userId) {
  return localStorage.getItem(LAST_VISIT_FLIGHTS_KEY_PREFIX + userId) || '1970-01-01T00:00:00Z'
}

function setLastFlightsVisitNow(userId) {
  localStorage.setItem(LAST_VISIT_FLIGHTS_KEY_PREFIX + userId, new Date().toISOString())
}

function loadSeenModules() {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

// forceLabelVisible : true dans le tiroir mobile (les libellés sont
// toujours visibles, il n'y a pas de survol au doigt). false sur desktop
// (les libellés suivent le survol du groupe, comportement original).
// onNavigate : ferme le tiroir mobile après un clic réussi sur un module.
function NavItem({ module, unseenCount, onLockedClick, onSeen, forceLabelVisible, onNavigate, currentPlan }) {
  const navigate = useNavigate()
  const unlocked = isUnlocked(module.requiredPlan, currentPlan)

  const handleClick = () => {
    if (!unlocked) {
      onLockedClick?.()
      return
    }
    onSeen(module.id)
    navigate(module.path)
    onNavigate?.()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy/5 transition-colors"
    >
      <span className={`shrink-0 relative ${unlocked ? 'text-navy/70' : 'text-navy/30'}`}>
        {icons[module.icon]}
        {unlocked && unseenCount > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-[3px] rounded-full bg-coral text-white text-[9px] font-semibold flex items-center justify-center leading-none">
            {unseenCount}
          </span>
        )}
      </span>
      <span className={`text-sm whitespace-nowrap transition-opacity duration-200 ${
        forceLabelVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } ${unlocked ? 'text-navy' : 'text-navy/40'}`}>
        {module.name}
      </span>
      {!unlocked && (
        <span className={`ml-auto shrink-0 w-4 h-4 rounded-full bg-navy flex items-center justify-center transition-opacity duration-200 ${
          forceLabelVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {icons.lock}
        </span>
      )}
    </button>
  )
}

function ToolboxNavItem({ onToolboxClick, forceLabelVisible }) {
  return (
    <button
      onClick={() => onToolboxClick?.('currency')}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy/5 transition-colors"
    >
      <span className="shrink-0 text-navy/70">{icons.toolbox}</span>
      <span className={`text-sm whitespace-nowrap transition-opacity duration-200 text-navy ${
        forceLabelVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        Boîte à outils
      </span>
    </button>
  )
}

export default function Sidebar({ onLockedClick, onToolboxClick }) {
  const [user, setUser] = useState(null)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [seenModules, setSeenModules] = useState(() => loadSeenModules())
  const [flightsNewCount, setFlightsNewCount] = useState(0)
  // Tiroir mobile : fermé par défaut. Sans lui, la sidebar desktop (qui ne
  // s'élargit qu'au survol) resterait bloquée à w-16 sur téléphone — pas de
  // souris, donc jamais de survol, donc les libellés des modules ne
  // s'afficheraient jamais.
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Plan réel de l'utilisateur (remplace le CURRENT_PLAN codé en dur).
  // Un admin voit tout débloqué, peu importe la colonne abonnement.
  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('abonnement, is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        setCurrentPlan(data?.is_admin ? 'frequent' : (data?.abonnement || 'free'))
        setIsAdminUser(Boolean(data?.is_admin))
      })
  }, [user])

  // Vrai compteur : lignes s_vol + s_hebergement créées depuis la dernière
  // visite de "Vols & hébergements" (remplace le chiffre codé en dur).
  useEffect(() => {
    if (!user) return

    async function loadNewFlightsCount() {
      const since = getLastFlightsVisit(user.id)
      const [{ count: volsCount }, { count: staysCount }] = await Promise.all([
        supabase.from('s_vol').select('id_vol', { count: 'exact', head: true }).eq('pid', user.id).gt('created_at', since),
        supabase.from('s_hebergement').select('id_hebergement', { count: 'exact', head: true }).eq('pid', user.id).gt('created_at', since),
      ])
      setFlightsNewCount((volsCount || 0) + (staysCount || 0))
    }
    loadNewFlightsCount()
  }, [user])

  const markAsSeen = (moduleId) => {
    if (moduleId === 'flights' && user) {
      setLastFlightsVisitNow(user.id)
      setFlightsNewCount(0)
    }

    setSeenModules((current) => {
      if (current.has(moduleId)) return current
      const next = new Set(current)
      next.add(moduleId)
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const homeHref = user ? '/dashboard' : '/'

  const navContent = (forceLabelVisible) => (
    <>
      <Link to={homeHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
        <span className={`font-serif text-navy font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
          forceLabelVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          Le Voyage Pour Tous
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto py-2">
        {MODULES.map((module) => (
          <NavItem
            key={module.id}
            module={module}
            unseenCount={
              module.id === 'flights'
                ? flightsNewCount
                : (seenModules.has(module.id) ? 0 : (NEW_CONTENT_COUNTS[module.id] || 0))
            }
            onLockedClick={onLockedClick}
            onSeen={markAsSeen}
            currentPlan={currentPlan}
            forceLabelVisible={forceLabelVisible}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}

        <ToolboxNavItem onToolboxClick={onToolboxClick} forceLabelVisible={forceLabelVisible} />

        <div className="h-px bg-navy/10 mx-4 my-2" />
        <Link
          to="/feuille-de-route"
          onClick={() => setMobileOpen(false)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy/5 transition-colors"
        >
          <span className="shrink-0 text-navy/70">{icons.clipboard}</span>
          <span className={`text-sm whitespace-nowrap transition-opacity duration-200 text-navy ${
            forceLabelVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            RetroCommission
          </span>
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Bouton hamburger — visible uniquement en dessous de sm (mobile).
          Ouvre le tiroir ci-dessous plutôt que de compter sur un survol
          qui n'existe pas au doigt. */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sm:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-white border border-navy/10 shadow-sm flex items-center justify-center text-navy"
        aria-label="Ouvrir le menu"
      >
        {icons.menu}
      </button>

      {/* Sidebar desktop : comportement inchangé (fixe, s'élargit au survol) */}
      <aside className="group hidden sm:flex fixed left-0 top-0 h-screen w-16 hover:w-64 transition-all duration-200 ease-in-out bg-white border-r border-navy/10 z-40 overflow-hidden flex-col">
        {navContent(false)}
      </aside>

      {/* Tiroir mobile : masqué par défaut, libellés toujours visibles
          (pas de survol au doigt), fond sombre cliquable pour fermer. */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          className="sm:hidden bg-navy/45"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="fixed left-0 top-0 h-screen w-72 bg-white flex flex-col"
          >
            <div className="flex items-center justify-end px-4 h-16 shrink-0 border-b border-navy/10">
              <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center text-navy/50" aria-label="Fermer le menu">
                {icons.close}
              </button>
            </div>
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
