import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { formatDate } from './dateUtils'
import Sidebar from './Sidebar'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import { DEFAULT_ITINERAIRE_COVER, formatDuree } from './Itineraires'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]

function transformVolsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_vol, type: 'vol', title: `${r.aeroport_depart} ➔ ${r.aeroport_arrivee}`,
    price: `${Number(r.prix).toFixed(0)}€`, date: `${formatDate(r.date_depart)} → ${formatDate(r.date_arrivee)}`,
    emoji: '✈️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformHebergementsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_hebergement, type: 'hebergement', title: `${r.type_hebergement || 'Hébergement'} à ${r.ville}`,
    price: `${Number(r.prix_nuit).toFixed(0)}€ / nuit`, date: `Disponible du ${formatDate(r.date_depart)} au ${formatDate(r.date_arrivee)}`,
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
    price: formatDuree(r) || 'Itinéraire',
    date: `${r.pays}${r.ville ? ` — ${r.ville}` : ''}`,
    emoji: '🗺️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: r.url_cover || DEFAULT_ITINERAIRE_COVER,
  }))
}
function transformVoyageCommunDeals(rows, categorieById) {
  return rows.map((r, i) => ({
    id: r.id_post, type: 'voyage_commun', title: r.titre,
    price: categorieById[r.id_categorie]?.nom || 'Post',
    date: `${r.pays}${r.ville ? ` — ${r.ville}` : ''}`,
    emoji: '💬', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
  }))
}

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

function formatRelativeDate(dateStr) {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return "à l'instant"
  if (diffHours < 24) return `il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'il y a 1 jour'
  if (diffDays < 30) return `il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR')
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#D85A30' : 'none'} stroke={filled ? '#D85A30' : '#8C8A82'} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

// Menu de partage identique à celui de ItineraireDetail.jsx : liens
// directs WhatsApp/Facebook/X, pas de navigator.share.
function ShareButton({ titre }) {
  const [open, setOpen] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const networks = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${titre} — ${url}`)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.2.2-.3.2-.5.1-1.4-.7-2.3-1.2-3.2-2.8-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5C10.2 9.7 9.8 8.7 9.6 8.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.9l-5.4-6.6L4.4 22H1.3l8-9.2L1 2h7l4.9 6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6l12.1 16Z"/></svg>
      ),
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-navy/60 hover:text-navy transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
        </svg>
        Partager
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-navy/10 py-1.5 z-20 min-w-[150px]">
          {networks.map((n) => (
            <a
              key={n.name} href={n.href} target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
            >
              {n.icon} {n.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VoyageCommunDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')
  const [editOpen, setEditOpen] = useState(false)

  const [post, setPost] = useState(null)
  const [categorie, setCategorie] = useState(null)
  const [authorName, setAuthorName] = useState('Un voyageur')
  const [notFound, setNotFound] = useState(false)

  const [aggregateScore, setAggregateScore] = useState(0)
  const [myVote, setMyVote] = useState(null)

  const [comments, setComments] = useState([])
  const [commentAuthors, setCommentAuthors] = useState({})
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

  const [flightDeals, setFlightDeals] = useState([])
  const [hotelDeals, setHotelDeals] = useState([])
  const [activityDeals, setActivityDeals] = useState([])
  const [itineraireDeals, setItineraireDeals] = useState([])
  const [voyageCommunDeals, setVoyageCommunDeals] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  const loadFavoritesData = async () => {
    const [{ data: d }, { data: h }, { data: a }, { data: it }, { data: vc }, { data: cat }, { data: f }] = await Promise.all([
      supabase.from('d_vol').select('*'),
      supabase.from('d_hebergement').select('*'),
      supabase.from('d_activite').select('*'),
      supabase.from('s_itineraire').select('*'),
      supabase.from('s_voyage_commun').select('*'),
      supabase.from('voyage_commun_categorie').select('*'),
      supabase.from('favoris').select('id_entite, nom').eq('actif', true),
    ])
    const categorieById = Object.fromEntries((cat || []).map((c) => [c.id_categorie, c]))
    setFlightDeals(transformVolsDeals(d || []))
    setHotelDeals(transformHebergementsDeals(h || []))
    setActivityDeals(transformActivitesDeals(a || []))
    setItineraireDeals(transformItineraireDeals(it || []))
    setVoyageCommunDeals(transformVoyageCommunDeals(vc || [], categorieById))
    setFavoriteIds(new Set((f || []).map((x) => `${x.nom}:${x.id_entite}`)))
  }

  useEffect(() => {
    if (!user) return
    loadFavoritesData()
  }, [user])

  const loadPost = async () => {
    const { data: postData, error } = await supabase
      .from('s_voyage_commun')
      .select('*')
      .eq('id_post', id)
      .single()

    if (error || !postData) {
      setNotFound(true)
      return
    }
    setPost(postData)

    const [{ data: categorieData }, { data: profile }] = await Promise.all([
      supabase.from('voyage_commun_categorie').select('*').eq('id_categorie', postData.id_categorie).single(),
      supabase.from('public_profiles').select('prenom').eq('id', postData.pid).single(),
    ])
    setCategorie(categorieData || null)
    setAuthorName(profile?.prenom || 'Un voyageur')
  }

  const loadVotes = async () => {
    const { data } = await supabase
      .from('votes')
      .select('pid, score')
      .eq('nom', 'voyage_commun')
      .eq('id_entite', id)
    if (!data) return
    const total = data.reduce((sum, v) => sum + v.score, 0)
    setAggregateScore(total)
    setMyVote(data.find((v) => v.pid === user?.id)?.score ?? null)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('voyage_commun_commentaire')
      .select('*')
      .eq('id_post', id)
      .order('created_at', { ascending: true })
    const list = data || []
    setComments(list)

    const pids = [...new Set(list.map((c) => c.pid))]
    if (pids.length) {
      const { data: profiles } = await supabase.from('public_profiles').select('id, prenom').in('id', pids)
      setCommentAuthors(Object.fromEntries((profiles || []).map((p) => [p.id, p.prenom || 'Un voyageur'])))
    }
  }

  useEffect(() => { loadPost() }, [id])
  useEffect(() => { if (user) { loadVotes(); loadComments() } }, [id, user])

  const castVote = async (value) => {
    if (!user) return
    if (myVote !== null) {
      await supabase.from('votes').delete().eq('pid', user.id).eq('id_entite', id).eq('nom', 'voyage_commun')
      setAggregateScore((s) => s - myVote)
      setMyVote(null)
      return
    }
    await supabase.from('votes').upsert(
      { pid: user.id, id_entite: id, nom: 'voyage_commun', score: value },
      { onConflict: 'pid,id_entite,nom' }
    )
    setAggregateScore((s) => s + value)
    setMyVote(value)
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

  const handleDeletePost = async () => {
    if (!window.confirm("Supprimer ce post ? Cette action est irréversible.")) return
    const { error } = await supabase.from('s_voyage_commun').delete().eq('id_post', id)
    if (error) {
      console.error('Erreur suppression post:', error.message)
      return
    }
    navigate('/voyage-commun')
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return
    const { error } = await supabase.from('voyage_commun_commentaire').delete().eq('id_commentaire', commentId)
    if (error) {
      console.error('Erreur suppression commentaire:', error.message)
      return
    }
    setComments((current) => current.filter((c) => c.id_commentaire !== commentId))
  }

  const submitComment = async () => {
    if (!newComment.trim() || !user) return
    setPosting(true)
    const { error } = await supabase.from('voyage_commun_commentaire').insert({
      id_post: id,
      pid: user.id,
      contenu: newComment.trim(),
    })
    if (!error) {
      setNewComment('')
      await loadComments()
    } else {
      console.error('Erreur submitComment:', error.message)
    }
    setPosting(false)
  }

  if (!user) return null
  if (notFound) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar onLockedClick={() => setPricingOpen(true)} onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }} />
        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-2xl mx-auto text-center py-20">
            <p className="text-navy/60 mb-4">Ce post n'existe pas ou a été retiré.</p>
            <Link to="/voyage-commun" className="text-coral hover:underline text-sm">← Retour à Voyage commun</Link>
          </div>
        </div>
      </div>
    )
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar onLockedClick={() => setPricingOpen(true)} onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }} />
        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-navy/15 border-t-coral rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const color = getColor(categorie?.couleur)
  const lieu = post.ville ? `${post.ville} — ${post.pays}` : post.pays
  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals, ...itineraireDeals, ...voyageCommunDeals]
  const favoriteDeals = ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`))
  const isFavorite = favoriteIds.has(`voyage_commun:${post.id_post}`)
  const canManagePost = post.pid === user.id || isAdmin

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar onLockedClick={() => setPricingOpen(true)} onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }} />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-end mb-8">
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <button onClick={() => setFavoritesOpen(true)} className="btn-primary text-sm py-2.5 px-5">Mes favoris</button>
                <button className="btn-primary text-sm py-2.5 px-5">Nos ateliers</button>
                <button onClick={() => setPricingOpen(true)} className="btn-primary text-sm py-2.5 px-5">Upgrade plan</button>
                <button onClick={() => supabase.auth.signOut()} className="text-sm text-navy/60 hover:text-coral transition-colors">Se déconnecter</button>
              </div>
            </div>

            <button onClick={() => navigate('/voyage-commun')} className="text-sm text-navy/50 hover:text-coral transition-colors mb-6 inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Retour
            </button>

            <div className="bg-white rounded-2xl border border-navy/10 p-6 sm:p-8">
              <div className="flex items-start justify-between mb-3">
                <span
                  className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-md"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {categorie?.nom || 'Post'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {canManagePost && (
                    <>
                      <button
                        onClick={() => setEditOpen(true)}
                        className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-navy/5 transition-colors text-navy/60"
                        aria-label="Modifier ce post"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-navy/60"
                        aria-label="Supprimer ce post"
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleFavorite({ id: post.id_post, type: 'voyage_commun' })}
                    className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-navy/5 transition-colors"
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <HeartIcon filled={isFavorite} />
                  </button>
                </div>
              </div>

              <h1 className="font-serif text-2xl text-navy mb-3">{post.titre}</h1>

              <div className="flex items-center gap-2 mb-5 text-sm text-navy/50">
                <span className="font-medium text-navy">{authorName}</span>
                <span>· {formatRelativeDate(post.created_at)} · {lieu}</span>
                {post.updated_at && <span className="text-navy/35">· modifié</span>}
              </div>

              <p className="text-sm text-navy/80 leading-relaxed mb-6">{post.description}</p>

              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-navy/10">
                <button
                  onClick={() => castVote(-1)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                    myVote === -1 ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
                  }`}
                  aria-label="Pas d'accord"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {/* Coral pour le score positif (cohérent avec DealCard/ItineraireCard) */}
                <span className={`text-base font-semibold w-8 text-center tabular-nums ${aggregateScore > 0 ? 'text-coral' : aggregateScore < 0 ? 'text-blue-600' : 'text-navy/60'}`}>
                  {aggregateScore > 0 ? `+${aggregateScore}` : aggregateScore}
                </span>
                <button
                  onClick={() => castVote(1)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                    myVote === 1 ? 'border-coral bg-coral/10 text-coral' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
                  }`}
                  aria-label="D'accord"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div className="ml-auto">
                  <ShareButton titre={post.titre} />
                </div>
              </div>

              <p className="text-sm font-medium text-navy mb-3">Discussion ({comments.length})</p>

              <div className="flex flex-col gap-3 mb-4">
                {comments.map((c) => {
                  const canManageComment = c.pid === user.id || isAdmin
                  return (
                    <div key={c.id_commentaire} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-coral/30 text-navy text-[10px] font-medium flex items-center justify-center shrink-0">
                        {(commentAuthors[c.pid] || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-navy/5 rounded-xl px-3 py-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-navy">{commentAuthors[c.pid] || 'Un voyageur'}</p>
                          {canManageComment && (
                            <button
                              onClick={() => handleDeleteComment(c.id_commentaire)}
                              className="text-navy/30 hover:text-red-500 transition-colors shrink-0"
                              aria-label="Supprimer ce commentaire"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-navy/75 mt-0.5">{c.contenu}</p>
                        <p className="text-[10px] text-navy/35 mt-1">{formatRelativeDate(c.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
                {comments.length === 0 && (
                  <p className="text-xs text-navy/40">Aucun commentaire pour l'instant.</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !posting) submitComment() }}
                  placeholder="Rebondir sur ce post"
                  className="flex-1 px-3 py-2 border border-navy/15 rounded-full text-xs focus:outline-none focus:border-coral"
                />
                <button
                  onClick={submitComment}
                  disabled={posting || !newComment.trim()}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  {posting ? '...' : 'Commenter'}
                </button>
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
          onClose={() => { setFavoritesOpen(false); loadFavoritesData() }}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {editOpen && (
        <CreateVoyageCommunModal
          userId={user.id}
          editingPost={post}
          onClose={() => setEditOpen(false)}
          onCreated={() => { setEditOpen(false); loadPost() }}
        />
      )}
    </>
  )
}
