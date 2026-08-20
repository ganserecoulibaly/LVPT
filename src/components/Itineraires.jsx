import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useFavoriLieuxEtPlats } from './useFavoriLieuxEtPlats'
import { formatDate } from './dateUtils'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import CreateItineraireModal from './CreateItineraireModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import QuickAddMenu from './QuickAddMenu'
import TipBanner from './TipBanner'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]

// Image générique fixe, utilisée si l'itinéraire n'a pas de couverture.
// Simple et fiable — pas de clé API, pas de recherche par ville à faire.
export const DEFAULT_ITINERAIRE_COVER = 'https://picsum.photos/id/1015/600/400'

export function formatDuree(itineraire) {
  if (itineraire.duree_totale_jour) {
    return `${itineraire.duree_totale_jour} jour${itineraire.duree_totale_jour > 1 ? 's' : ''}`
  }
  if (itineraire.duree_totale_heure) {
    return `${itineraire.duree_totale_heure}h`
  }
  return null
}

function transformVolsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_vol, type: 'vol',
    title: `${r.aeroport_depart} ➔ ${r.aeroport_arrivee}`,
    price: `${Number(r.prix).toFixed(0)}€`,
    date: `${formatDate(r.date_depart)} → ${formatDate(r.date_arrivee)}`,
    emoji: '✈️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformHebergementsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_hebergement, type: 'hebergement',
    title: `${r.type_hebergement || 'Hébergement'} à ${r.ville}`,
    price: `${Number(r.prix_nuit).toFixed(0)}€ / nuit`,
    date: `Disponible du ${formatDate(r.date_depart)} au ${formatDate(r.date_arrivee)}`,
    emoji: '🏨', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformActivitesDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_activite, type: 'activite', title: r.nom_activite,
    price: r.prix ? `${Number(r.prix).toFixed(0)}€` : 'Gratuit',
    date: r.ville, emoji: '🎟️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
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

function ItineraireCard({ itineraire, authorName, locked, onOpen, onLockedClick, userId, isFavorite, onToggleFavorite, refreshKey }) {
  const duree = formatDuree(itineraire)
  const [aggregateScore, setAggregateScore] = useState(0)
  const [myVote, setMyVote] = useState(null) // -1 | 1 | null

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
      // Un vote existe déjà : on le retire, peu importe le bouton cliqué.
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
  const handleOpen = () => (locked ? onLockedClick() : onOpen(itineraire.id_itineraire))

  return (
    <div className="text-left rounded-xl border border-navy/10 bg-white overflow-hidden hover:border-navy/20 transition-colors relative">
      <button onClick={handleOpen} className="cursor-pointer w-full text-left block">
        <div className="relative h-28">
          <img
            src={itineraire.url_cover || DEFAULT_ITINERAIRE_COVER}
            alt=""
            className={`w-full h-full object-cover ${locked ? 'opacity-60' : ''}`}
          />
          {duree && (
            <span className="absolute top-2 left-2 bg-navy/80 text-white text-[11px] px-2 py-1 rounded-md">
              {duree}
            </span>
          )}
          {!locked && (
            <span
              onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onToggleFavorite() } }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-navy/30 backdrop-blur-sm flex items-center justify-center hover:bg-navy/45 transition-colors"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <HeartIcon filled={isFavorite} />
            </span>
          )}
        </div>
        <div className="p-3 pb-2">
          <p className="text-sm font-medium text-navy truncate">{itineraire.titre}</p>
          <p className="text-xs text-navy/55 mt-1">
            {itineraire.pays}{itineraire.ville ? ` — ${itineraire.ville}` : ''}
          </p>
          <p className="text-[11px] text-navy/40 mt-1">Créé par {authorName}</p>
        </div>
      </button>

      {!locked && (
        <div className="flex items-center gap-3 px-3 pb-3">
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
      )}

      {locked && (
        <button onClick={onLockedClick} className="absolute inset-0 flex items-center justify-center bg-navy/20 cursor-pointer w-full">
          <span className="bg-white text-navy text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Abonnement
          </span>
        </button>
      )}
    </div>
  )
}

export default function Itineraires() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const { favoriLieuxEtPlats, refetchFavoriLieuxEtPlats } = useFavoriLieuxEtPlats(user)
  const [profile, setProfile] = useState(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [createVoyageCommunOpen, setCreateVoyageCommunOpen] = useState(false)

  const [itineraires, setItineraires] = useState([])
  const [authors, setAuthors] = useState({})
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedPays, setSelectedPays] = useState('')
  const [selectedVille, setSelectedVille] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [sort, setSort] = useState('recent')

  const [flightDeals, setFlightDeals] = useState([])
  const [hotelDeals, setHotelDeals] = useState([])
  const [activityDeals, setActivityDeals] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [voteRefreshKey, setVoteRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('abonnement, is_admin').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))

    async function loadFavoritesData() {
      // Pas de filtre sur "nom" : cette requête récupère aussi bien les
      // favoris vols/hébergements/activités que les favoris itinéraires.
      const [{ data: d }, { data: h }, { data: a }, { data: f }] = await Promise.all([
        supabase.from('d_vol').select('*'),
        supabase.from('d_hebergement').select('*'),
        supabase.from('d_activite').select('*'),
        supabase.from('favoris').select('id_entite, nom').eq('actif', true),
      ])
      setFlightDeals(transformVolsDeals(d || []))
      setHotelDeals(transformHebergementsDeals(h || []))
      setActivityDeals(transformActivitesDeals(a || []))
      setFavoriteIds(new Set((f || []).map((x) => `${x.nom}:${x.id_entite}`)))
    }
    loadFavoritesData()
  }, [user])

  const loadScores = async (list) => {
    const ids = list.map((i) => i.id_itineraire)
    if (!ids.length) return
    const { data: votes } = await supabase
      .from('votes')
      .select('id_entite, score')
      .eq('nom', 'itineraire')
      .in('id_entite', ids)
    const tally = {}
    ;(votes || []).forEach((v) => { tally[v.id_entite] = (tally[v.id_entite] || 0) + v.score })
    setScores(tally)
  }

  const loadItineraires = async () => {
    setLoading(true)
    const { data } = await supabase.from('s_itineraire').select('*').order('created_at', { ascending: false })
    const list = data || []
    setItineraires(list)

    const pids = [...new Set(list.map((i) => i.pid))]
    if (pids.length) {
      const { data: profiles } = await supabase.from('public_profiles').select('id, prenom').in('id', pids)
      setAuthors(Object.fromEntries((profiles || []).map((p) => [p.id, p.prenom || 'Un voyageur'])))
    }

    const ids = list.map((i) => i.id_itineraire)
    if (ids.length) {
      await loadScores(list)
    }

    setLoading(false)
  }

  useEffect(() => { loadItineraires() }, [])

  const toggleFavorite = async (deal) => {
    const key = `${deal.type}:${deal.id}`
    const isCurrentlyFavorite = favoriteIds.has(key)
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
    if (deal.type === 'lieu' || deal.type === 'plat') refetchFavoriLieuxEtPlats()
  }

  if (!user) return null

  const isFree = profile && !profile.is_admin && profile.abonnement === 'free'
  const recentIds = new Set(
    [...itineraires]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map((i) => i.id_itineraire)
  )

  const paysList = [...new Set(itineraires.map((i) => i.pays))].sort((a, b) => a.localeCompare(b, 'fr'))
  const villeList = [...new Set(itineraires.filter((i) => i.ville).map((i) => i.ville))].sort((a, b) => a.localeCompare(b, 'fr'))

  let filtered = itineraires.filter((i) => {
    if (search && !i.titre.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedPays && i.pays !== selectedPays) return false
    if (selectedVille && i.ville !== selectedVille) return false
    if (selectedFormat === 'sejour' && !i.duree_totale_jour) return false
    if (selectedFormat === 'journee' && !i.duree_totale_heure) return false
    return true
  })
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'long') return (b.duree_totale_jour || 0) - (a.duree_totale_jour || 0)
    if (sort === 'court_sejour') return (a.duree_totale_jour || 999) - (b.duree_totale_jour || 999)
    if (sort === 'court_sortie') return (a.duree_totale_heure || 999) - (b.duree_totale_heure || 999)
    if (sort === 'tendance') return (scores[b.id_itineraire] || 0) - (scores[a.id_itineraire] || 0)
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals, ...transformItineraires(itineraires)]
  const favoriteDeals = ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`)).concat(favoriLieuxEtPlats)

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-6xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <div className="mb-8">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="font-serif text-3xl text-navy">Itinéraires</h1>
                <QuickAddMenu
                  open={quickAddOpen}
                  onToggle={() => setQuickAddOpen((o) => !o)}
                  onClose={() => setQuickAddOpen(false)}
                  onCreateItineraire={() => { setQuickAddOpen(false); setCreateOpen(true) }}
                  onCreateVoyageCommun={() => { setQuickAddOpen(false); setCreateVoyageCommunOpen(true) }}
                  onSearchFlights={() => { setQuickAddOpen(false); navigate('/vols-hebergements') }}
                />
              </div>
              <p className="text-navy/70 text-center sm:text-left">Des parcours partagés par la communauté, ou crée le tien.</p>
            </div>

            <TipBanner nomPage="itineraires" />

            {isFree && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-coral/5 border border-coral/20 text-sm text-navy/70">
                Compte gratuit : tu vois les 3 derniers itinéraires publiés.{' '}
                <button onClick={() => setPricingOpen(true)} className="text-coral font-medium hover:underline">
                  Passe à l'abonnement
                </button>{' '}
                pour tous les débloquer.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un itinéraire"
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-4 focus:outline-none focus:border-coral"
                />

                <p className="text-xs text-navy/40 mb-1.5">Pays</p>
                <select
                  value={selectedPays} onChange={(e) => setSelectedPays(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white mb-4 focus:outline-none focus:border-coral"
                >
                  <option value="">Tous les pays</option>
                  {paysList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>

                <p className="text-xs text-navy/40 mb-1.5">Ville</p>
                <select
                  value={selectedVille} onChange={(e) => setSelectedVille(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white mb-4 focus:outline-none focus:border-coral"
                >
                  <option value="">Toutes les villes</option>
                  {villeList.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>

                <p className="text-xs text-navy/40 mb-1.5">Format</p>
                <select
                  value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white mb-4 focus:outline-none focus:border-coral"
                >
                  <option value="">Tous les formats</option>
                  <option value="sejour">Séjour (plusieurs jours)</option>
                  <option value="journee">Sortie d'une journée</option>
                </select>

                <p className="text-xs text-navy/40 mb-1.5">Trier par</p>
                <select
                  value={sort} onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral"
                >
                  <option value="recent">Plus récent</option>
                  <option value="tendance">Tendance</option>
                  <option value="long">Plus long</option>
                  <option value="court_sejour">Plus court (séjour)</option>
                  <option value="court_sortie">Plus court (sortie)</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-navy/10 bg-white overflow-hidden animate-pulse">
                        <div className="h-28 bg-navy/10" />
                        <div className="p-3">
                          <div className="h-3 w-3/4 bg-navy/10 rounded mb-2" />
                          <div className="h-3 w-1/2 bg-navy/10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center">
                    <p className="text-sm text-navy/50">Aucun itinéraire ne correspond à ta recherche.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((it) => (
                      <ItineraireCard
                        key={it.id_itineraire}
                        itineraire={it}
                        authorName={authors[it.pid] || 'Un voyageur'}
                        locked={isFree && !recentIds.has(it.id_itineraire) && it.pid !== user.id}
                        onOpen={(id) => navigate(`/itineraires/${id}`)}
                        onLockedClick={() => setPricingOpen(true)}
                        userId={user.id}
                        isFavorite={favoriteIds.has(`itineraire:${it.id_itineraire}`)}
                        onToggleFavorite={() => toggleFavorite({ id: it.id_itineraire, type: 'itineraire' })}
                        refreshKey={voteRefreshKey}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal
          onClose={() => { setFavoritesOpen(false); setVoteRefreshKey((k) => k + 1); loadScores(itineraires) }}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}

      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
      {createOpen && (
        <CreateItineraireModal
          userId={user.id}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadItineraires() }}
        />
      )}

      {createVoyageCommunOpen && (
        <CreateVoyageCommunModal
          userId={user.id}
          onClose={() => setCreateVoyageCommunOpen(false)}
          onCreated={() => { setCreateVoyageCommunOpen(false); navigate('/voyage-commun') }}
        />
      )}
    </>
  )
}
