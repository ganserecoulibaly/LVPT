import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { usePlanAccess } from './usePlanAccess'
import PlanLockedScreen from './PlanLockedScreen'

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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

export default function PlatDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, allowed } = usePlanAccess('occasional')
  const [plat, setPlat] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [score, setScore] = useState(0)
  const [myVote, setMyVote] = useState(null)
  const [isFavori, setIsFavori] = useState(false)
  const [comments, setComments] = useState([])
  const [commentAuthors, setCommentAuthors] = useState({})
  const [nouveauCommentaire, setNouveauCommentaire] = useState('')
  const [pricingOpen, setPricingOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadPlat = () => {
    supabase.from('d_plat').select('*').eq('id_plat', id).single()
      .then(({ data }) => setPlat(data))
  }

  const loadVotes = () => {
    supabase.from('votes').select('pid, score').eq('nom', 'gastronomie').eq('id_entite', id)
      .then(({ data }) => {
        if (!data) return
        setScore(data.reduce((s, v) => s + v.score, 0))
        setMyVote(data.find((v) => v.pid === user?.id)?.score ?? null)
      })
  }

  const loadFavori = () => {
    if (!user) return
    supabase.from('favoris').select('id_entite').eq('pid', user.id).eq('id_entite', id).eq('nom', 'plat').eq('actif', true).maybeSingle()
      .then(({ data }) => setIsFavori(Boolean(data)))
  }

  const loadComments = () => {
    supabase.from('s_plat_commentaire').select('*').eq('id_plat', id).order('created_at', { ascending: true })
      .then(({ data }) => {
        const list = data || []
        setComments(list)
        const pids = [...new Set(list.map((c) => c.pid))]
        if (pids.length) {
          supabase.from('public_profiles').select('id, prenom').in('id', pids)
            .then(({ data: profiles }) => {
              setCommentAuthors(Object.fromEntries((profiles || []).map((p) => [p.id, p.prenom || 'Un voyageur'])))
            })
        }
      })
  }

  useEffect(() => { loadPlat(); loadComments() }, [id])
  useEffect(() => {
    if (!user) return
    loadVotes()
    loadFavori()
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user, id])

  const castVote = async (value) => {
    if (!user) return
    if (myVote !== null) {
      await supabase.from('votes').delete().eq('pid', user.id).eq('id_entite', id).eq('nom', 'gastronomie')
      setScore((s) => s - myVote)
      setMyVote(null)
      return
    }
    await supabase.from('votes').upsert(
      { pid: user.id, id_entite: id, nom: 'gastronomie', score: value },
      { onConflict: 'pid,id_entite,nom' }
    )
    setScore((s) => s + value)
    setMyVote(value)
  }

  const toggleFavori = async () => {
    let error
    if (isFavori) {
      ;({ error } = await supabase.from('favoris').update({ actif: false }).eq('pid', user.id).eq('id_entite', id).eq('nom', 'plat'))
    } else {
      ;({ error } = await supabase.from('favoris').upsert(
        { pid: user.id, id_entite: id, nom: 'plat', actif: true },
        { onConflict: 'pid,id_entite,nom' }
      ))
    }
    if (error) {
      alert("Impossible de mettre à jour ce favori : " + error.message)
      return
    }
    setIsFavori((f) => !f)
  }

  const submitComment = async () => {
    if (!nouveauCommentaire.trim()) return
    const { error } = await supabase.from('s_plat_commentaire').insert({
      id_plat: id,
      pid: user.id,
      contenu: nouveauCommentaire.trim(),
    })
    if (error) {
      alert("Impossible de publier ce commentaire : " + error.message)
      return
    }
    setNouveauCommentaire('')
    loadComments()
  }

  const handleDeleteComment = async (idCommentaire) => {
    await supabase.from('s_plat_commentaire').delete().eq('id_commentaire', idCommentaire)
    loadComments()
  }

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Carnet gastronomique"
        requiredPlan="occasional"
        pricingOpen={pricingOpen}
        onPricingOpen={() => setPricingOpen(true)}
        onPricingClose={() => setPricingOpen(false)}
        onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
      />
    )
  }

  if (!plat) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar onLockedClick={() => setPricingOpen(true)} onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }} />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-2xl mx-auto">
          <Link to="/carnet-gastronomique" className="text-xs text-navy/50 hover:text-navy transition-colors mb-4 inline-block">
            ← Retour au carnet
          </Link>

          <div className="bg-white border border-navy/10 rounded-2xl overflow-hidden">
            {plat.lien_photo ? (
              <img src={plat.lien_photo} alt={plat.nom_plat} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-coral/60 to-coral flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><path d="M6 1v3M10 1v3M14 1v3" />
                </svg>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="font-serif text-2xl text-navy">{plat.nom_plat}</h1>
                <button onClick={toggleFavori} className="w-9 h-9 rounded-full bg-coral/10 flex items-center justify-center shrink-0" aria-label="Favori">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavori ? '#993556' : 'none'} stroke={isFavori ? '#993556' : '#712B13'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-navy/50 mb-0.5">
                {plat.nom_restaurant} · {plat.ville}, {plat.pays}
              </p>
              {plat.adresse_restaurant && <p className="text-xs text-navy/40 mb-1">{plat.adresse_restaurant}</p>}
              <p className="text-base text-coral font-medium mb-4">{plat.prix}</p>

              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => castVote(-1)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${myVote === -1 ? 'border-coral text-coral' : 'border-navy/15 text-navy/50'}`}
                >−</button>
                <span className="text-base font-medium text-navy">{score}</span>
                <button
                  onClick={() => castVote(1)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${myVote === 1 ? 'border-coral text-coral' : 'border-navy/15 text-navy/50'}`}
                >+</button>
              </div>

              {plat.notes && (
                <>
                  <p className="text-xs text-navy/40 uppercase tracking-wide mb-1.5">Notes du voyageur</p>
                  <p className="text-sm text-navy/80 bg-navy/5 rounded-xl px-3 py-2.5 mb-5 leading-relaxed">{plat.notes}</p>
                </>
              )}

              <div className="border-t border-navy/10 pt-4">
                <p className="text-sm font-medium text-navy mb-3">Discussion ({comments.length})</p>

                <div className="flex flex-col gap-3 mb-4">
                  {comments.map((c) => {
                    const canManage = c.pid === user.id || isAdmin
                    return (
                      <div key={c.id_commentaire} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-coral/30 text-navy text-[10px] font-medium flex items-center justify-center shrink-0">
                          {(commentAuthors[c.pid] || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-navy/5 rounded-xl px-3 py-2 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-navy">{commentAuthors[c.pid] || 'Un voyageur'}</p>
                            {canManage && (
                              <button onClick={() => handleDeleteComment(c.id_commentaire)} className="text-navy/30 hover:text-red-500 transition-colors shrink-0" aria-label="Supprimer">
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
                  {comments.length === 0 && <p className="text-xs text-navy/40">Aucun commentaire pour l'instant.</p>}
                </div>

                <div className="flex gap-2">
                  <input
                    value={nouveauCommentaire}
                    onChange={(e) => setNouveauCommentaire(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && nouveauCommentaire.trim()) submitComment() }}
                    placeholder="Rebondir sur ce post"
                    className="flex-1 px-3 py-2 border border-navy/15 rounded-full text-xs focus:outline-none focus:border-coral"
                  />
                  <button onClick={submitComment} disabled={!nouveauCommentaire.trim()} className="btn-primary text-xs py-2 px-4 disabled:opacity-50">
                    Commenter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-0 sm:ml-16">
        <Footer />
      </div>
    </div>
  )
}
