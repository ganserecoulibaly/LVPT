import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { formatDate } from './dateUtils'
import Sidebar from './Sidebar'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
function getMapsUrl(step) {
  const query = step.adresse || step.lieu
  if (!query) return null
  const encoded = encodeURIComponent(query)
  return isIOS() ? `https://maps.apple.com/?q=${encoded}` : `https://www.google.com/maps/search/?api=1&query=${encoded}`
}

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
        className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
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

export default function ItineraireDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const [itineraire, setItineraire] = useState(null)
  const [authorName, setAuthorName] = useState('Un voyageur')
  const [days, setDays] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [aggregateScore, setAggregateScore] = useState(0)
  const [myVote, setMyVote] = useState(null)

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

  useEffect(() => {
    if (!user) return
    async function loadFavoritesData() {
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
    loadFavoritesData()
  }, [user])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const { data: it, error: itError } = await supabase.from('s_itineraire').select('*').eq('id_itineraire', id).single()
      if (itError || !it) {
        setError("Cet itinéraire n'existe pas ou n'est plus disponible.")
        setLoading(false)
        return
      }
      setItineraire(it)

      const { data: profile } = await supabase.from('public_profiles').select('prenom').eq('id', it.pid).single()
      setAuthorName(profile?.prenom || 'Un voyageur')

      const { data: joursData } = await supabase
        .from('s_itineraire_jour').select('*').eq('id_itineraire', id).order('jour_numero', { ascending: true })

      const jourIds = (joursData || []).map((j) => j.id_jour)
      let stepsByJour = {}
      if (jourIds.length) {
        const { data: stepsData } = await supabase
          .from('s_itineraire_step').select('*').in('id_jour', jourIds).order('no_ordre', { ascending: true })
        ;(stepsData || []).forEach((s) => {
          if (!stepsByJour[s.id_jour]) stepsByJour[s.id_jour] = []
          stepsByJour[s.id_jour].push(s)
        })
      }

      const merged = (joursData || []).map((j) => ({ ...j, steps: stepsByJour[j.id_jour] || [] }))
      setDays(merged)
      if (merged.length > 0) setSelectedDay(merged[0].id_jour)

      if (user) {
        const { data: votes } = await supabase.from('votes').select('pid, score').eq('nom', 'itineraire').eq('id_entite', id)
        const total = (votes || []).reduce((sum, v) => sum + v.score, 0)
        setAggregateScore(total)
        setMyVote((votes || []).find((v) => v.pid === user.id)?.score ?? null)
      }

      setLoading(false)
    }
    load()
  }, [id, user])

  const castVote = async (value) => {
    if (!user) return
    if (myVote !== null) {
      await supabase.from('votes').delete().eq('pid', user.id).eq('id_entite', id).eq('nom', 'itineraire')
      setAggregateScore((s) => s - myVote)
      setMyVote(null)
      return
    }
    await supabase.from('votes').upsert(
      { pid: user.id, id_entite: id, nom: 'itineraire', score: value },
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

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet itinéraire ? Cette action est irréversible.")) return
    const { error } = await supabase.from('s_itineraire').delete().eq('id_itineraire', id)
    if (error) {
      console.error('Erreur suppression itinéraire:', error.message)
      return
    }
    navigate('/itineraires')
  }

  if (!user) return null

  const currentDay = days.find((d) => d.id_jour === selectedDay)
  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals, ...itineraireDeals, ...voyageCommunDeals]
  const favoriteDeals = ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`))
  const canManage = itineraire && (itineraire.pid === user.id || isAdmin)

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar onLockedClick={() => setPricingOpen(true)} onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }} />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-end mb-8">
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <button onClick={() => setFavoritesOpen(true)} className="btn-primary text-sm py-2.5 px-5">Mes favoris</button>
                <button className="btn-primary text-sm py-2.5 px-5">Nos ateliers</button>
                <button onClick={() => setPricingOpen(true)} className="btn-primary text-sm py-2.5 px-5">Upgrade plan</button>
                <button onClick={() => supabase.auth.signOut()} className="text-sm text-navy/60 hover:text-coral transition-colors">Se déconnecter</button>
              </div>
            </div>

            <button onClick={() => navigate('/itineraires')} className="text-sm text-navy/50 hover:text-coral transition-colors mb-4 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Tous les itinéraires
            </button>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-navy/15 border-t-coral rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-navy/10 bg-white p-8 text-center text-sm text-navy/50">{error}</div>
            ) : (
              <div className="rounded-xl border border-navy/10 bg-white overflow-hidden">
                <div className="h-36 relative">
                  <img src={itineraire.url_cover || DEFAULT_ITINERAIRE_COVER} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-navy/55 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="bg-coral text-white text-xs px-2.5 py-1 rounded-md">Itinéraire</span>
                      <ShareButton titre={itineraire.titre} />
                    </div>
                    <div>
                      <h1 className="font-serif text-2xl text-white">{itineraire.titre}</h1>
                      <p className="text-white/70 text-xs mt-1">
                        {itineraire.pays}{itineraire.ville ? ` — ${itineraire.ville}` : ''} · Créé par {authorName}
                        {formatDuree(itineraire) ? ` · ${formatDuree(itineraire)}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    {itineraire.description ? (
                      <p className="text-sm text-navy/60 flex-1">{itineraire.description}</p>
                    ) : <span />}
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => castVote(-1)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${myVote === -1 ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy/15 text-navy/60 hover:bg-navy/5'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      <span className="text-sm font-semibold w-8 text-center tabular-nums">
                        {aggregateScore > 0 ? `+${aggregateScore}` : aggregateScore}
                      </span>
                      <button
                        onClick={() => castVote(1)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${myVote === 1 ? 'border-coral bg-coral/10 text-coral' : 'border-navy/15 text-navy/60 hover:bg-navy/5'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      {canManage && (
                        <button
                          onClick={handleDelete}
                          className="w-7 h-7 rounded-full border border-navy/15 text-navy/60 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors ml-1"
                          aria-label="Supprimer cet itinéraire"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>

                  {days.length === 0 ? (
                    <p className="text-sm text-navy/50">Aucun jour n'a encore été ajouté à cet itinéraire.</p>
                  ) : (
                    <>
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 border-b border-navy/10">
                        {days.map((d) => (
                          <button
                            key={d.id_jour}
                            onClick={() => setSelectedDay(d.id_jour)}
                            className={`rounded-lg px-3 py-2 min-w-[110px] text-left shrink-0 transition-colors ${
                              selectedDay === d.id_jour ? 'bg-coral text-white' : 'bg-navy/5 hover:bg-navy/10'
                            }`}
                          >
                            <p className={`text-[11px] ${selectedDay === d.id_jour ? 'text-white/70' : 'text-navy/40'}`}>Jour {d.jour_numero}</p>
                            <p className={`text-xs font-medium ${selectedDay === d.id_jour ? 'text-white' : 'text-navy'}`}>{d.titre || '—'}</p>
                          </button>
                        ))}
                      </div>

                      {currentDay && (
                        <>
                          <p className="font-serif text-lg text-navy mb-1">
                            Jour {currentDay.jour_numero}{currentDay.titre ? ` — ${currentDay.titre}` : ''}
                          </p>
                          {currentDay.sous_titre && <p className="text-sm text-navy/55 mb-4">{currentDay.sous_titre}</p>}

                          {currentDay.steps.length === 0 ? (
                            <p className="text-sm text-navy/40">Aucune étape prévue ce jour-là.</p>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {currentDay.steps.map((step, i) => {
                                const mapsUrl = getMapsUrl(step)
                                return (
                                  <div key={step.id_segment} className="flex items-center gap-3 bg-navy/5 rounded-lg p-2.5">
                                    <div className="w-5 h-5 rounded-full bg-coral text-white text-[11px] flex items-center justify-center shrink-0">{i + 1}</div>
                                    {step.url_cover ? (
                                      <img src={step.url_cover} alt="" className="w-11 h-11 rounded-md object-cover shrink-0" />
                                    ) : (
                                      <div className="w-11 h-11 rounded-md bg-navy/10 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-navy truncate">{step.nom_etape}</p>
                                      <p className="text-xs text-navy/55 truncate">{step.adresse || step.lieu || ''}</p>
                                    </div>
                                    {step.heure && <span className="text-xs text-navy/40 shrink-0">{step.heure}</span>}
                                    {mapsUrl && (
                                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-md border border-navy/15 flex items-center justify-center shrink-0 hover:bg-navy/5 transition-colors" aria-label="Ouvrir la localisation">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-0 sm:ml-16"><Footer /></div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal onClose={() => setFavoritesOpen(false)} favoriteDeals={favoriteDeals} userId={user.id} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
    </>
  )
}
