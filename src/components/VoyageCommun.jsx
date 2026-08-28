import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import CreateItineraireModal from './CreateItineraireModal'
import QuickAddMenu from './QuickAddMenu'
import TipBanner from './TipBanner'
import ShareButton from './ShareButton'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]
const PAGE_SIZE = 20

// Lieux (Activités & musées) et plats (Carnet gastronomique) mis en
// favoris — cette page ne charge pas ces catalogues pour son propre
// usage, donc on récupère uniquement les entrées effectivement
// favorites, pas tout le catalogue.
function transformLieuxFavoris(rows) {
  return rows.map((r, i) => ({
    id: r.id_lieu, type: 'lieu',
    title: r.nom,
    price: 'Lieu à visiter',
    date: `${r.ville}${r.quartier ? ` — ${r.quartier}` : ''}, ${r.pays}`,
    emoji: '🏛️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: null,
  }))
}

function transformPlatsFavoris(rows) {
  return rows.map((r, i) => ({
    id: r.id_plat, type: 'plat',
    title: r.nom_plat,
    price: r.prix,
    date: `${r.nom_restaurant} · ${r.ville}, ${r.pays}`,
    emoji: '🍽️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: r.lien_photo || null,
  }))
}

function transformVolsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_vol, type: 'vol',
    title: `${r.aeroport_depart} ➔ ${r.aeroport_arrivee}`,
    price: `${Number(r.prix).toFixed(0)}€`,
    date: `${r.date_depart} → ${r.date_arrivee}`,
    emoji: '✈️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformHebergementsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_hebergement, type: 'hebergement',
    title: `${r.type_hebergement || 'Hébergement'} à ${r.ville}`,
    price: `${Number(r.prix_nuit).toFixed(0)}€ / nuit`,
    date: `Disponible du ${r.date_depart} au ${r.date_arrivee}`,
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
function transformItineraireDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_itineraire, type: 'itineraire', title: r.titre,
    price: r.duree_totale_jour ? `${r.duree_totale_jour} jours` : (r.duree_totale_heure ? `${r.duree_totale_heure}h` : 'Itinéraire'),
    date: `${r.pays}${r.ville ? ` — ${r.ville}` : ''}`,
    emoji: '🗺️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: r.url_cover || 'https://picsum.photos/id/1015/600/400',
  }))
}
function transformVoyageCommunDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_post, type: 'voyage_commun', title: r.titre,
    price: r.voyage_commun_categorie?.nom || 'Post',
    date: `${r.pays}${r.ville ? ` — ${r.ville}` : ''}`,
    emoji: '💬', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
  }))
}

// Palette par nom de couleur (colonne `couleur` de voyage_commun_categorie).
const COLOR_MAP = {
  green: { bg: '#EAF3DE', text: '#27500A', border: '#639922' },
  amber: { bg: '#FAEEDA', text: '#633806', border: '#BA7517' },
  blue: { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  pink: { bg: '#FBEAF0', text: '#72243E', border: '#D4537E' },
  teal: { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' },
  red: { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' },
}
const DEFAULT_COLOR = { bg: '#F1EFE8', text: '#444441', border: '#B4B2A9' }

function getColor(nom) {
  return COLOR_MAP[nom] || DEFAULT_COLOR
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#D85A30' : 'none'} stroke={filled ? '#D85A30' : '#8C8A82'} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

// PostCard est un <button>, pas un <div onClick> : ça le rend atteignable
// au clavier (Tab) et activable au clavier (Entrée/Espace), contrairement
// à un simple div cliquable qui est invisible pour la navigation clavier
// et les lecteurs d'écran.
function PostCard({ post, categorie, authorName, score, isFavorite, onToggleFavorite, onOpen }) {
  const color = getColor(categorie?.couleur)
  const lieu = post.ville ? `${post.ville} — ${post.pays}` : post.pays

  return (
    <button
      onClick={onOpen}
      className="relative text-left w-full rounded-xl border border-navy/10 bg-white overflow-hidden hover:border-navy/20 transition-colors"
      style={{ borderLeft: `3px solid ${color.border}` }}
    >
      <span
        onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onToggleFavorite() } }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cream/80 flex items-center justify-center hover:bg-cream transition-colors z-10"
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <HeartIcon filled={isFavorite} />
      </span>

      <div className="p-3">
        <span
          className="inline-block text-[10px] font-medium px-2 py-1 rounded-md"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {categorie?.nom || 'Post'}
        </span>
        <p className="text-sm font-medium text-navy mt-2 mb-1 line-clamp-2">{post.titre}</p>
        <p className="text-xs text-navy/50 mb-2">{lieu}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-navy/40">{authorName}</span>
          {/* Coral pour le score positif, cohérent avec le reste de l'app
              (DealCard/ItineraireCard) — le vert était réservé à la
              catégorie "Bon plan" et créait une confusion visuelle. */}
          <span className={`text-xs font-medium ${score > 0 ? 'text-coral' : score < 0 ? 'text-blue-600' : 'text-navy/40'}`}>
            {score > 0 ? `+${score}` : score}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function VoyageCommun() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [createItineraireOpen, setCreateItineraireOpen] = useState(false)

  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Options de filtre calculées sur TOUT le contenu (pas seulement la page
  // chargée), pour que Pays/Ville restent complets même avec la pagination.
  const [filterMeta, setFilterMeta] = useState([])

  const [selectedCategorie, setSelectedCategorie] = useState('')
  const [selectedPays, setSelectedPays] = useState('')
  const [selectedVille, setSelectedVille] = useState('')
  const [sort, setSort] = useState('recent')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchDebounce = useRef(null)

  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoriLieuxEtPlats, setFavoriLieuxEtPlats] = useState([])
  const [authors, setAuthors] = useState({})
  const [flightDeals, setFlightDeals] = useState([])
  const [hotelDeals, setHotelDeals] = useState([])
  const [activityDeals, setActivityDeals] = useState([])
  const [itineraireDeals, setItineraireDeals] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return

    async function loadFavoritesData() {
      const [{ data: d }, { data: h }, { data: a }, { data: it }, { data: f }] = await Promise.all([
        supabase.from('d_vol').select('*'),
        supabase.from('d_hebergement').select('*'),
        supabase.from('d_activite').select('*'),
        supabase.from('s_itineraire').select('*'),
        supabase.from('favoris').select('id_entite, nom').eq('actif', true),
      ])
      setFlightDeals(transformVolsDeals(d || []))
      setHotelDeals(transformHebergementsDeals(h || []))
      setActivityDeals(transformActivitesDeals(a || []))
      setItineraireDeals(transformItineraireDeals(it || []))
      setFavoriteIds(new Set((f || []).map((x) => `${x.nom}:${x.id_entite}`)))

      const idsLieux = (f || []).filter((x) => x.nom === 'lieu').map((x) => x.id_entite)
      const idsPlats = (f || []).filter((x) => x.nom === 'plat').map((x) => x.id_entite)
      const [{ data: lieuxFav }, { data: platsFav }] = await Promise.all([
        idsLieux.length ? supabase.from('d_lieu').select('*').in('id_lieu', idsLieux) : Promise.resolve({ data: [] }),
        idsPlats.length ? supabase.from('d_plat').select('*').in('id_plat', idsPlats) : Promise.resolve({ data: [] }),
      ])
      setFavoriLieuxEtPlats([
        ...transformLieuxFavoris(lieuxFav || []),
        ...transformPlatsFavoris(platsFav || []),
      ])
    }
    loadFavoritesData()
  }, [user])

  // Métadonnées légères (3 colonnes) pour peupler les filtres Pays/Ville
  // sans dépendre de la page actuellement chargée.
  const loadFilterMeta = async () => {
    const { data } = await supabase.from('s_voyage_commun').select('pays, ville, id_categorie')
    setFilterMeta(data || [])
  }

  const loadScores = async (list) => {
    const ids = list.map((p) => p.id_post)
    if (!ids.length) return
    const { data: votes } = await supabase
      .from('votes')
      .select('id_entite, score')
      .eq('nom', 'voyage_commun')
      .in('id_entite', ids)
    const tally = {}
    ;(votes || []).forEach((v) => { tally[v.id_entite] = (tally[v.id_entite] || 0) + v.score })
    setScores((current) => ({ ...current, ...tally }))
  }

  // Requête paginée + filtrée, avec jointure sur la catégorie (clé
  // étrangère existante : s_voyage_commun.id_categorie -> voyage_commun_categorie).
  // Les auteurs sont récupérés à part (pas de FK déclarée vers public_profiles,
  // donc pas d'embedding automatique fiable côté PostgREST).
  const fetchPage = async (offset, { categorie, pays, ville, searchTerm }) => {
    let query = supabase
      .from('s_voyage_commun')
      .select('*, voyage_commun_categorie(id_categorie, nom, couleur, icone)')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (categorie) query = query.eq('id_categorie', categorie)
    if (pays) query = query.eq('pays', pays)
    if (ville) query = query.eq('ville', ville)
    if (searchTerm.trim()) {
      const term = searchTerm.trim()
      query = query.or(`titre.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erreur chargement posts:', error.message)
      return []
    }

    const list = data || []
    const pids = [...new Set(list.map((p) => p.pid))]
    if (pids.length) {
      const { data: profiles } = await supabase.from('public_profiles').select('id, prenom').in('id', pids)
      setAuthors((current) => ({
        ...current,
        ...Object.fromEntries((profiles || []).map((p) => [p.id, p.prenom || 'Un voyageur'])),
      }))
    }

    return list
  }

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    const filters = { categorie: selectedCategorie, pays: selectedPays, ville: selectedVille, searchTerm: search }
    const list = await fetchPage(0, filters)
    setPosts(list)
    setHasMore(list.length === PAGE_SIZE)
    await loadScores(list)
    setLoading(false)
  }, [selectedCategorie, selectedPays, selectedVille, search])

  const loadMore = async () => {
    setLoadingMore(true)
    const filters = { categorie: selectedCategorie, pays: selectedPays, ville: selectedVille, searchTerm: search }
    const next = await fetchPage(posts.length, filters)
    setPosts((current) => [...current, ...next])
    setHasMore(next.length === PAGE_SIZE)
    await loadScores(next)
    setLoadingMore(false)
  }

  useEffect(() => { loadFilterMeta() }, [])

  // Bug corrigé : `categories` n'était jamais rempli — le select "Type"
  // n'avait donc jamais que "Tous les types" comme option possible.
  useEffect(() => {
    supabase.from('voyage_commun_categorie').select('*').order('ordre', { ascending: true })
      .then(({ data }) => setCategories(data || []))
  }, [])
  useEffect(() => { loadFirstPage() }, [loadFirstPage])

  // Recherche libre : on attend une pause de 400ms après la dernière frappe
  // avant de relancer la requête, pour ne pas spammer Supabase à chaque lettre.
  const handleSearchInput = (value) => {
    setSearchInput(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setSearch(value), 400)
  }

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
      console.error('Erreur toggleFavorite:', error.message)
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (isCurrentlyFavorite) next.add(key)
        else next.delete(key)
        return next
      })
    }
  }

  if (!user) return null

  // Pays/Ville en cascade, calculés depuis filterMeta (tout le contenu),
  // filtré par catégorie puis par pays sélectionnés.
  const metaForPays = filterMeta.filter((p) => !selectedCategorie || p.id_categorie === selectedCategorie)
  const paysList = [...new Set(metaForPays.map((p) => p.pays))].sort((a, b) => a.localeCompare(b, 'fr'))
  const metaForVille = metaForPays.filter((p) => !selectedPays || p.pays === selectedPays)
  const villeList = [...new Set(metaForVille.filter((p) => p.ville).map((p) => p.ville))].sort((a, b) => a.localeCompare(b, 'fr'))

  const handleCategorieChange = (value) => { setSelectedCategorie(value); setSelectedPays(''); setSelectedVille('') }
  const handlePaysChange = (value) => { setSelectedPays(value); setSelectedVille('') }

  const hasActiveFilters = selectedCategorie || selectedPays || selectedVille || sort !== 'recent' || search
  const resetFilters = () => {
    setSelectedCategorie(''); setSelectedPays(''); setSelectedVille('')
    setSort('recent'); setSearchInput(''); setSearch('')
  }

  // "Tendance" trie ce qui est déjà chargé (score décroissant) ; charger
  // plus de posts continue d'ajouter les suivants dans l'ordre chronologique
  // puis retrie l'ensemble affiché.
  const displayedPosts = sort === 'tendance'
    ? [...posts].sort((a, b) => (scores[b.id_post] || 0) - (scores[a.id_post] || 0))
    : posts

  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals, ...itineraireDeals, ...transformVoyageCommunDeals(posts)]
  const favoriteDeals = [
    ...ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`)),
    ...favoriLieuxEtPlats,
  ]

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
                <h1 className="font-serif text-3xl text-navy">Voyage commun</h1>
                <QuickAddMenu
                  open={quickAddOpen}
                  onToggle={() => setQuickAddOpen((o) => !o)}
                  onClose={() => setQuickAddOpen(false)}
                  onCreateItineraire={() => { setQuickAddOpen(false); setCreateItineraireOpen(true) }}
                  onCreateVoyageCommun={() => { setQuickAddOpen(false); setCreateOpen(true) }}
                  onSearchFlights={() => { setQuickAddOpen(false); navigate('/vols-hebergements') }}
                />
              </div>
              <p className="text-navy/70 text-center sm:text-left">Conseils, bons plans et alertes partagés par la communauté.</p>
            </div>

            <TipBanner nomPage="voyage-commun" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <input
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Rechercher un post"
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-4 focus:outline-none focus:border-coral"
                />

                <p className="text-xs text-navy/40 mb-1.5">Type</p>
                <select
                  value={selectedCategorie} onChange={(e) => handleCategorieChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white mb-4 focus:outline-none focus:border-coral"
                >
                  <option value="">Tous les types</option>
                  {categories.map((c) => <option key={c.id_categorie} value={c.id_categorie}>{c.nom}</option>)}
                </select>

                <p className="text-xs text-navy/40 mb-1.5">Pays</p>
                <select
                  value={selectedPays} onChange={(e) => handlePaysChange(e.target.value)}
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

                <p className="text-xs text-navy/40 mb-1.5">Trier par</p>
                <select
                  value={sort} onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral"
                >
                  <option value="recent">Plus récent</option>
                  <option value="tendance">Tendance</option>
                </select>

                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-coral hover:underline mt-3">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              <div className="lg:col-span-3">
                {loading ? (
                  // Squelette de chargement plutôt qu'un écran vide, le temps
                  // que la première page arrive.
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-navy/10 bg-white p-3 animate-pulse">
                        <div className="h-4 w-16 bg-navy/10 rounded mb-3" />
                        <div className="h-3 w-full bg-navy/10 rounded mb-2" />
                        <div className="h-3 w-2/3 bg-navy/10 rounded" />
                      </div>
                    ))}
                  </div>
                ) : displayedPosts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center">
                    <p className="text-sm text-navy/50">Aucun post ne correspond à ta recherche.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {displayedPosts.map((post) => (
                        <PostCard
                          key={post.id_post}
                          post={post}
                          categorie={post.voyage_commun_categorie}
                          authorName={authors[post.pid] || 'Un voyageur'}
                          score={scores[post.id_post] || 0}
                          isFavorite={favoriteIds.has(`voyage_commun:${post.id_post}`)}
                          onToggleFavorite={() => toggleFavorite({ id: post.id_post, type: 'voyage_commun' })}
                          onOpen={() => navigate(`/voyage-commun/${post.id_post}`)}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="text-sm text-navy/60 border border-navy/15 rounded-full px-5 py-2 hover:bg-navy/5 transition-colors disabled:opacity-50"
                        >
                          {loadingMore ? 'Chargement…' : 'Charger plus de posts'}
                        </button>
                      </div>
                    )}
                  </>
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
          onClose={() => { setFavoritesOpen(false); loadScores(posts) }}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}

      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
      {createOpen && (
        <CreateVoyageCommunModal
          userId={user.id}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadFirstPage(); loadFilterMeta() }}
        />
      )}

      {createItineraireOpen && (
        <CreateItineraireModal
          userId={user.id}
          onClose={() => setCreateItineraireOpen(false)}
          onCreated={() => { setCreateItineraireOpen(false); navigate('/itineraires') }}
        />
      )}
    </>
  )
}
