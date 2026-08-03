import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { formatDate } from './dateUtils'
import { DEFAULT_ITINERAIRE_COVER, formatDuree } from './Itineraires'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import Footer from './Footer'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import NextTripCard from './NextTripCard'
import ActivityFeed from './ActivityFeed'
import FeatureVoting from './FeatureVoting'
import CreateItineraireModal from './CreateItineraireModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import QuickAddMenu from './QuickAddMenu'
import TipBanner from './TipBanner'
import DealsRow from './DealsRow'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]

function transformVols(rows) {
  return rows.map((r, i) => ({
    id: r.id_vol,
    type: 'vol',
    title: `${r.aeroport_depart} ➔ ${r.aeroport_arrivee}`,
    price: `${Number(r.prix).toFixed(0)}€`,
    date: `${formatDate(r.date_depart)} → ${formatDate(r.date_arrivee)}`,
    emoji: '✈️',
    fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    link: r.lien_resa,
  }))
}

function transformHebergements(rows) {
  return rows.map((r, i) => ({
    id: r.id_hebergement,
    type: 'hebergement',
    title: `${r.type_hebergement || 'Hébergement'} à ${r.ville}`,
    price: `${Number(r.prix_nuit).toFixed(0)}€ / nuit`,
    date: `Disponible du ${formatDate(r.date_depart)} au ${formatDate(r.date_arrivee)}`,
    emoji: '🏨',
    fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    link: r.lien_resa,
  }))
}

function transformActivites(rows) {
  return rows.map((r, i) => ({
    id: r.id_activite,
    type: 'activite',
    title: r.nom_activite,
    price: r.prix ? `${Number(r.prix).toFixed(0)}€` : 'Gratuit',
    date: r.ville,
    emoji: '🎟️',
    fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    link: r.lien_resa,
  }))
}

function transformItineraires(rows) {
  return rows.map((r, i) => ({
    id: r.id_itineraire, type: 'itineraire',
    title: r.titre,
    price: formatDuree(r) || 'Itinéraire',
    date: `${r.pays}${r.ville ? ` — ${r.ville}` : ''}`,
    emoji: '🗺️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: r.url_cover || DEFAULT_ITINERAIRE_COVER,
  }))
}

// ---------- Vote + favoris, même logique et même charte que DealCard.jsx ----------

const NAVY = [27, 42, 65]
const CORAL = [216, 90, 48]
const BLUE = [59, 130, 246]
const MAX_MAGNITUDE = 10

function mix(colorA, colorB, t) {
  return colorA.map((c, i) => Math.round(c + (colorB[i] - c) * t))
}

function getCounterColor(value) {
  const intensity = Math.min(Math.abs(value) / MAX_MAGNITUDE, 1)
  const target = value > 0 ? CORAL : value < 0 ? BLUE : NAVY
  const [r, g, b] = mix(NAVY, target, intensity)
  return `rgb(${r}, ${g}, ${b})`
}

function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#D85A30' : 'none'} stroke={filled ? '#D85A30' : 'white'} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

// Carte itinéraire avec vote (+1/-1) et favori (♥), même comportement que
// les cartes "Bons plans" (DealCard.jsx) : vote et favori auto-gérés par
// carte, sans dépendre d'un fetch agrégé côté parent.
function ItineraireVoteCard({ itineraire, userId, isFavorite, onToggleFavorite, onOpen, refreshKey }) {
  const duree = formatDuree(itineraire)
  const [aggregateScore, setAggregateScore] = useState(0)
  const [myVote, setMyVote] = useState(null)

  useEffect(() => {
    async function loadVotes() {
      const { data } = await supabase
        .from('votes')
        .select('pid, score')
        .eq('nom', 'itineraire')
        .eq('id_entite', itineraire.id_itineraire)
      if (!data) return
      const total = data.reduce((sum, v) => sum + v.score, 0)
      setAggregateScore(total)
      setMyVote(data.find((v) => v.pid === userId)?.score ?? null)
    }
    loadVotes()
  }, [itineraire.id_itineraire, userId, refreshKey])

  const castVote = async (value, e) => {
    e.stopPropagation()
    if (!userId) return

    if (myVote !== null) {
      await supabase.from('votes').delete().eq('pid', userId).eq('id_entite', itineraire.id_itineraire).eq('nom', 'itineraire')
      setAggregateScore((s) => s - myVote)
      setMyVote(null)
      return
    }

    await supabase.from('votes').upsert(
      { pid: userId, id_entite: itineraire.id_itineraire, nom: 'itineraire', score: value },
      { onConflict: 'pid,id_entite,nom' }
    )
    setAggregateScore((s) => s + value)
    setMyVote(value)
  }

  const color = getCounterColor(aggregateScore)

  return (
    <div className="text-left rounded-xl border border-navy/10 bg-white overflow-hidden hover:border-navy/20 transition-colors shrink-0 w-64">
      <div onClick={onOpen} className="cursor-pointer">
        <div className="relative h-32">
          <img src={itineraire.url_cover || DEFAULT_ITINERAIRE_COVER} alt="" className="w-full h-full object-cover" />
          {duree && (
            <span className="absolute top-2 left-2 bg-navy/80 text-white text-[10px] px-2 py-0.5 rounded-md">{duree}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-navy/30 backdrop-blur-sm flex items-center justify-center hover:bg-navy/45 transition-colors"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        </div>
        <div className="p-2.5 pb-1.5">
          <p className="text-xs font-medium text-navy truncate">{itineraire.titre}</p>
          <p className="text-[11px] text-navy/50 mt-0.5">
            {itineraire.pays}{itineraire.ville ? ` — ${itineraire.ville}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-2.5 pb-2.5">
        <button
          onClick={(e) => castVote(-1, e)}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
            myVote === -1 ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
          }`}
          aria-label="Moins bon itinéraire"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span
          className="text-sm font-semibold w-8 text-center tabular-nums transition-colors duration-200"
          style={{ color }}
        >
          {aggregateScore > 0 ? `+${aggregateScore}` : aggregateScore}
        </span>

        <button
          onClick={(e) => castVote(1, e)}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
            myVote === 1 ? 'border-coral bg-coral/10 text-coral' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
          }`}
          aria-label="Bon itinéraire"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Reprend exactement le pattern de DealsRow (flèches de scroll, largeur de
// carte w-64) pour que les itinéraires s'affichent avec le même nombre
// d'items visibles à l'écran que les autres rangées du Dashboard.
// Le tri (plus récent d'abord) vient de la requête Supabase côté Dashboard
// (`order('created_at', { ascending: false })`), pas de ce composant.
function ItineraireRow({ itineraires, userId, favoriteIds, onToggleFavorite, refreshKey }) {
  const navigate = useNavigate()
  const scrollRef = React.useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows)
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [itineraires])

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 288, behavior: 'smooth' })
  }

  if (itineraires.length === 0) return null

  return (
    <div className="mb-10">
      <p className="font-serif text-lg text-navy mb-4">Itinéraires à découvrir</p>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-navy/10 flex items-center justify-center text-navy hover:bg-navy/5 transition-colors"
            aria-label="Précédent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-navy/10 flex items-center justify-center text-navy hover:bg-navy/5 transition-colors"
            aria-label="Suivant"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {itineraires.map((it) => (
            <ItineraireVoteCard
              key={it.id_itineraire}
              itineraire={it}
              userId={userId}
              isFavorite={favoriteIds.has(`itineraire:${it.id_itineraire}`)}
              onToggleFavorite={() => onToggleFavorite({ id: it.id_itineraire, type: 'itineraire' })}
              onOpen={() => navigate(`/itineraires/${it.id_itineraire}`)}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Menu "+" — voir QuickAddMenu.jsx, extrait en composant partagé pour
// être réutilisé sur Itineraires.jsx, VolsHebergements.jsx et VoyageCommun.jsx.

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [paysDepartFav, setPaysDepartFav] = useState(null)
  const [villeDepartFav, setVilleDepartFav] = useState(null)
  const [miles, setMiles] = useState({ starAlliance: null, skyteam: null, oneworld: null })
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickCreateItineraireOpen, setQuickCreateItineraireOpen] = useState(false)
  const [quickCreateVoyageCommunOpen, setQuickCreateVoyageCommunOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [firstTimeProfileOpen, setFirstTimeProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const [flightDeals, setFlightDeals] = useState([])
  const [hotelDeals, setHotelDeals] = useState([])
  const [activityDeals, setActivityDeals] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [itineraires, setItineraires] = useState([])
  const [voteRefreshKey, setVoteRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin, pays_depart_fav, ville_depart_fav, miles_star_alliance, miles_skyteam, miles_oneworld').eq('id', user.id).single()
      .then(({ data }) => {
        setIsAdmin(Boolean(data?.is_admin))
        setPaysDepartFav(data?.pays_depart_fav || null)
        setVilleDepartFav(data?.ville_depart_fav || null)
        setMiles({
          starAlliance: data?.miles_star_alliance ?? null,
          skyteam: data?.miles_skyteam ?? null,
          oneworld: data?.miles_oneworld ?? null,
        })
      })
  }, [user])

  // Popup "Compléter mon profil" : ne s'affiche qu'une seule fois dans la
  // vie d'un compte (profil_a_completer_vu), jamais réévaluée sur la base
  // des champs remplis — le téléphone est facultatif, son absence ne doit
  // pas rouvrir la popup indéfiniment.
  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('profil_a_completer_vu').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data?.profil_a_completer_vu) setFirstTimeProfileOpen(true)
      })
  }, [user])

  useEffect(() => {
    if (!user) return

    async function loadDeals() {
      const [{ data: vols }, { data: hebergements }, { data: activites }, { data: favoris }, { data: itinerairesData }] = await Promise.all([
        supabase.from('d_vol').select('*').order('score', { ascending: false }),
        supabase.from('d_hebergement').select('*').order('score', { ascending: false }),
        supabase.from('d_activite').select('*').order('score', { ascending: false }),
        supabase.from('favoris').select('id_entite, nom').eq('actif', true),
        supabase.from('s_itineraire').select('*').order('created_at', { ascending: false }),
      ])

      setFlightDeals(transformVols(vols || []))
      setHotelDeals(transformHebergements(hebergements || []))

      // Priorité d'affichage : ville du départ favori d'abord, puis pays,
      // puis le reste du catalogue — jamais d'exclusion, juste un tri, pour
      // que la rangée reste toujours complète comme les autres.
      const allActivites = activites || []
      const scored = allActivites.map((a) => {
        const matchVille = villeDepartFav && a.ville?.trim().toLowerCase() === villeDepartFav.trim().toLowerCase()
        const matchPays = paysDepartFav && a.pays?.trim().toLowerCase() === paysDepartFav.trim().toLowerCase()
        const priority = matchVille ? 0 : matchPays ? 1 : 2
        return { ...a, _priority: priority }
      })
      scored.sort((a, b) => a._priority - b._priority || (b.score || 0) - (a.score || 0))

      setActivityDeals(transformActivites(scored))
      setItineraires(itinerairesData || [])

      // Un favori "vol" ou "hébergement" dont la date de fin est dépassée
      // est retiré automatiquement, sans action de l'utilisateur.
      // Les favoris "itineraire" n'ont pas de date de fin : ils ne sont
      // jamais expirés automatiquement ici, ils passent directement en validKeys.
      const now = new Date()
      const endDateByKey = {}
      ;(vols || []).forEach((v) => { endDateByKey[`vol:${v.id_vol}`] = v.date_arrivee })
      ;(hebergements || []).forEach((h) => { endDateByKey[`hebergement:${h.id_hebergement}`] = h.date_arrivee })

      const validKeys = new Set()
      const expired = []

      ;(favoris || []).forEach((f) => {
        const key = `${f.nom}:${f.id_entite}`
        const endDate = endDateByKey[key]
        if (endDate && new Date(endDate) < now) {
          expired.push(f)
        } else {
          validKeys.add(key)
        }
      })

      setFavoriteIds(validKeys)

      if (expired.length > 0) {
        Promise.all(
          expired.map((f) =>
            supabase.from('favoris').delete().eq('pid', user.id).eq('id_entite', f.id_entite).eq('nom', f.nom)
          )
        )
      }
    }
    loadDeals()
  }, [user, paysDepartFav, villeDepartFav])

  const toggleFavorite = async (deal) => {
    const key = `${deal.type}:${deal.id}`
    const isCurrentlyFavorite = favoriteIds.has(key)

    // Mise à jour optimiste de l'affichage
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (isCurrentlyFavorite) next.delete(key)
      else next.add(key)
      return next
    })

    const { error } = await supabase.from('favoris').upsert(
      { pid: user.id, id_entite: deal.id, nom: deal.type, actif: !isCurrentlyFavorite },
      { onConflict: 'pid,id_entite,nom' }
    )
    if (error) {
      // L'écriture a échoué (ex: contrainte CHECK sur favoris.nom qui
      // n'accepte pas encore 'itineraire') : on annule la mise à jour
      // optimiste pour ne pas laisser l'UI mentir sur l'état réel.
      console.error('Erreur toggleFavorite:', error.message)
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (isCurrentlyFavorite) next.add(key)
        else next.delete(key)
        return next
      })
    }
  }

  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals, ...transformItineraires(itineraires)]
  const favoriteDeals = ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`))

  if (!user) return null // évite un flash sans nom le temps que le user se charge

  const firstName = isAdmin
    ? 'Admin'
    : (user.user_metadata?.first_name ||
      user.user_metadata?.given_name ||
      user.user_metadata?.full_name?.split(' ')[0] ||
      user.email?.split('@')[0])

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="font-serif text-3xl text-navy">Dashboard</h1>
              <QuickAddMenu
                open={quickAddOpen}
                onToggle={() => setQuickAddOpen((o) => !o)}
                onClose={() => setQuickAddOpen(false)}
                onCreateItineraire={() => { setQuickAddOpen(false); setQuickCreateItineraireOpen(true) }}
                onCreateVoyageCommun={() => { setQuickAddOpen(false); setQuickCreateVoyageCommunOpen(true) }}
                onSearchFlights={() => { setQuickAddOpen(false); navigate('/vols-hebergements') }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-6">
              <p className="text-navy/70">
                Bienvenue, {firstName} 👋
              </p>
              <button
                onClick={() => setProfileOpen(true)}
                className="bg-white border border-navy/10 rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-2 text-xs text-navy hover:border-coral transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center shrink-0">✈️</span>
                <span className="text-navy/50">Turkish Airlines</span>
                <span className="font-medium">{(miles.starAlliance || 0).toLocaleString('fr-FR')} miles</span>
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                className="bg-white border border-navy/10 rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-2 text-xs text-navy hover:border-coral transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center shrink-0">✈️</span>
                <span className="text-navy/50">Air France</span>
                <span className="font-medium">{(miles.skyteam || 0).toLocaleString('fr-FR')} miles</span>
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                className="bg-white border border-navy/10 rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-2 text-xs text-navy hover:border-coral transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center shrink-0">✈️</span>
                <span className="text-navy/50">Iberia</span>
                <span className="font-medium">{(miles.oneworld || 0).toLocaleString('fr-FR')} miles</span>
              </button>
            </div>

            <p className="font-serif text-2xl sm:text-3xl text-coral text-center mb-10">
              Planifiez, vibrez, apprenez.<br className="hidden sm:block" /> Votre prochain voyage commence ici.
            </p>

            <TipBanner nomPage="dashboard" />

            <NextTripCard />

            <DealsRow
              title="Bons plans vols"
              deals={flightDeals}
              userId={user.id}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />

            <DealsRow
              title="Bons plans hôtels"
              deals={hotelDeals}
              userId={user.id}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />

            <DealsRow
              title="Bons plans activités"
              deals={activityDeals}
              userId={user.id}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />

            <ItineraireRow
              itineraires={itineraires}
              userId={user.id}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              refreshKey={voteRefreshKey}
            />

            <ActivityFeed />

            <FeatureVoting userId={user.id} />
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {pricingOpen && (
        <PricingModal onClose={() => setPricingOpen(false)} />
      )}

      {favoritesOpen && (
        <FavoritesModal
          onClose={() => { setFavoritesOpen(false); setVoteRefreshKey((k) => k + 1) }}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {toolboxOpen && (
        <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />
      )}

      {profileOpen && (
        <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />
      )}

      {firstTimeProfileOpen && (
        <EditProfileModal userId={user.id} firstTime onClose={() => setFirstTimeProfileOpen(false)} />
      )}

      {quickCreateItineraireOpen && (
        <CreateItineraireModal
          userId={user.id}
          onClose={() => setQuickCreateItineraireOpen(false)}
          onCreated={() => { setQuickCreateItineraireOpen(false); navigate('/itineraires') }}
        />
      )}

      {quickCreateVoyageCommunOpen && (
        <CreateVoyageCommunModal
          userId={user.id}
          onClose={() => setQuickCreateVoyageCommunOpen(false)}
          onCreated={() => { setQuickCreateVoyageCommunOpen(false); navigate('/voyage-commun') }}
        />
      )}
    </>
  )
}
