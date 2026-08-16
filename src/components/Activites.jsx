import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import Footer from './Footer'
import { usePlanAccess } from './usePlanAccess'
import PlanLockedScreen from './PlanLockedScreen'
import { useFavoriLieuxEtPlats } from './useFavoriLieuxEtPlats'

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

const GRADIENTS = [
  'linear-gradient(135deg, #F0997B, #D85A30)',
  'linear-gradient(135deg, #7F77DD, #534AB7)',
  'linear-gradient(135deg, #5DCAA5, #0F6E56)',
  'linear-gradient(135deg, #ED93B1, #993556)',
]

// Ordre d'affichage fixe : vert (positif) → violet (vigilance) → rouge
// (arnaque) — jamais mélangé, peu importe l'ordre de saisie.
const CATEGORIE_ORDRE = ['Conseil', 'Bon plan', 'Tips', 'Vigilance', 'Arnaque']
const CATEGORIE_STYLE = {
  'Conseil': { bg: '#EAF3DE', text: '#27500A' },
  'Bon plan': { bg: '#EAF3DE', text: '#27500A' },
  'Tips': { bg: '#EAF3DE', text: '#27500A' },
  'Vigilance': { bg: '#EEEDFE', text: '#3C3489' },
  'Arnaque': { bg: '#FCEBEB', text: '#791F1F' },
}

function CommentairePill({ categorie }) {
  const style = CATEGORIE_STYLE[categorie]
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>
      {categorie}
    </span>
  )
}

function LieuCard({ lieu, index, isSelected, onSelect, isFavori, onToggleFavori }) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer ${isSelected ? 'border-2 border-coral' : 'border border-navy/10'}`}
    >
      <div className="h-20 flex items-center justify-center relative" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
        </svg>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavori() }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
          aria-label="Favori"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isFavori ? '#993556' : 'none'} stroke={isFavori ? '#993556' : '#712B13'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-navy mb-0.5 truncate">{lieu.nom}</p>
        <p className="text-[11px] text-navy/50 truncate">{lieu.ville}{lieu.quartier ? ` · ${lieu.quartier}` : ''}</p>
      </div>
    </div>
  )
}

function AjouterLieuModal({ userId, onClose, onCreated }) {
  const [nom, setNom] = useState('')
  const [pays, setPays] = useState('')
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [contenu, setContenu] = useState('')
  const [categorie, setCategorie] = useState('Conseil')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!nom.trim() || !pays.trim() || !ville.trim()) {
      setError('Renseigne au moins le nom, le pays et la ville.')
      return
    }
    setSaving(true)
    setError(null)
    const { data: lieu, error: insertError } = await supabase.from('d_lieu').insert({
      nom: nom.trim(),
      pays: pays.trim(),
      ville: ville.trim(),
      quartier: quartier.trim() || null,
      pid: userId,
    }).select().single()

    if (insertError || !lieu) {
      setSaving(false)
      setError("Impossible d'ajouter ce lieu pour le moment.")
      return
    }

    if (contenu.trim()) {
      await supabase.from('s_lieu_commentaire').insert({
        id_lieu: lieu.id_lieu,
        pid: userId,
        contenu: contenu.trim(),
        categorie,
      })
    }

    setSaving(false)
    onCreated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1 text-center">Ajouter un lieu</p>
        <p className="text-sm text-navy/55 mb-5 text-center">Partage un musée ou un site avec la communauté.</p>

        <div className="flex flex-col gap-2.5 mb-4">
          <input type="text" placeholder="Nom du lieu (ex : Le Louvre)" value={nom} onChange={(e) => setNom(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Pays" value={pays} onChange={(e) => setPays(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
            <input type="text" placeholder="Ville" value={ville} onChange={(e) => setVille(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          </div>
          <input type="text" placeholder="Quartier (facultatif)" value={quartier} onChange={(e) => setQuartier(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        </div>

        <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Premier commentaire (facultatif)</p>
        <textarea
          placeholder="Un conseil, un bon plan, une mise en garde..."
          value={contenu} onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral resize-none mb-2"
        />
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATEGORIE_ORDRE.map((cat) => {
            const style = CATEGORIE_STYLE[cat]
            return (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: style.bg,
                  color: style.text,
                  outline: categorie === cat ? `2px solid ${style.text}` : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce lieu'}
        </button>
      </div>
    </div>
  )
}

function CompleterLieuModal({ lieu, userId, onClose, onUpdated }) {
  const [contenu, setContenu] = useState('')
  const [categorie, setCategorie] = useState('Conseil')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!contenu.trim()) {
      setError('Écris un commentaire avant d\'enregistrer.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('s_lieu_commentaire').insert({
      id_lieu: lieu.id_lieu,
      pid: userId,
      contenu: contenu.trim(),
      categorie,
    })
    setSaving(false)
    if (insertError) {
      setError("Impossible d'ajouter ce commentaire pour le moment.")
      return
    }
    onUpdated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1 text-center">Compléter "{lieu.nom}"</p>
        <p className="text-sm text-navy/55 mb-5 text-center">Ajoute un conseil, un bon plan ou une mise en garde.</p>

        <textarea
          placeholder="Un conseil, un bon plan, une mise en garde..."
          value={contenu} onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral resize-none mb-2"
        />
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATEGORIE_ORDRE.map((cat) => {
            const style = CATEGORIE_STYLE[cat]
            return (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: style.bg,
                  color: style.text,
                  outline: categorie === cat ? `2px solid ${style.text}` : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function Activites() {
  const { user, allowed } = usePlanAccess('frequent')
  const [lieux, setLieux] = useState([])
  const [commentaires, setCommentaires] = useState([])
  const [favoriIds, setFavoriIds] = useState(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [commentAuthors, setCommentAuthors] = useState({})
  const [selectedLieuId, setSelectedLieuId] = useState(null)
  const detailRef = React.useRef(null)
  const [filtrePays, setFiltrePays] = useState('')
  const [filtreVille, setFiltreVille] = useState('')
  const [filtreQuartier, setFiltreQuartier] = useState('')

  const [nouveauCommentaire, setNouveauCommentaire] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [completerLieu, setCompleterLieu] = useState(null)

  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadLieux = () => {
    supabase.from('d_lieu').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setLieux(data || []))
  }

  const loadCommentaires = () => {
    supabase.from('s_lieu_commentaire').select('*')
      .then(({ data }) => setCommentaires(data || []))
  }

  const loadFavoris = () => {
    if (!user) return
    supabase.from('favoris').select('id_entite').eq('pid', user.id).eq('nom', 'lieu').eq('actif', true)
      .then(({ data }) => setFavoriIds(new Set((data || []).map((f) => f.id_entite))))
  }

  useEffect(() => { loadLieux(); loadCommentaires() }, [])
  useEffect(() => { loadFavoris() }, [user])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  // Auteurs des messages de discussion (pas des tips, volontairement
  // anonymes) — même pattern que VoyageCommunDetail.jsx.
  useEffect(() => {
    const pids = [...new Set(commentaires.filter((c) => c.categorie === null).map((c) => c.pid))]
    if (pids.length === 0) return
    supabase.from('public_profiles').select('id, prenom').in('id', pids)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach((p) => { map[p.id] = p.prenom || 'Un voyageur' })
        setCommentAuthors((prev) => ({ ...prev, ...map }))
      })
  }, [commentaires])

  const paysConnus = useMemo(() => [...new Set(lieux.map((l) => l.pays))].sort(), [lieux])

  const { favoriLieuxEtPlats: favoriteDeals, toggleFavoriGeneric } = useFavoriLieuxEtPlats(user)
  const villesFiltrees = useMemo(() => {
    const source = filtrePays ? lieux.filter((l) => l.pays === filtrePays) : lieux
    return [...new Set(source.map((l) => l.ville))].sort()
  }, [lieux, filtrePays])
  const quartiersFiltres = useMemo(() => {
    const source = lieux.filter((l) => (!filtrePays || l.pays === filtrePays) && (!filtreVille || l.ville === filtreVille))
    return [...new Set(source.map((l) => l.quartier).filter(Boolean))].sort()
  }, [lieux, filtrePays, filtreVille])

  const lieuxFiltres = useMemo(() => {
    return lieux.filter((l) => {
      if (filtrePays && l.pays !== filtrePays) return false
      if (filtreVille && l.ville !== filtreVille) return false
      if (filtreQuartier && l.quartier !== filtreQuartier) return false
      return true
    })
  }, [lieux, filtrePays, filtreVille, filtreQuartier])

  const selectedLieu = lieux.find((l) => l.id_lieu === selectedLieuId) || null

  // Défile automatiquement vers l'encart de détail dès qu'un lieu est
  // sélectionné — l'encart étant maintenant juste après les filtres,
  // ça évite de devoir chercher où il est apparu.
  useEffect(() => {
    if (selectedLieuId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedLieuId])

  const tipsDuLieu = useMemo(() => {
    if (!selectedLieuId) return []
    return commentaires
      .filter((c) => c.id_lieu === selectedLieuId && c.categorie !== null)
      .sort((a, b) => CATEGORIE_ORDRE.indexOf(a.categorie) - CATEGORIE_ORDRE.indexOf(b.categorie))
  }, [commentaires, selectedLieuId])

  const discussionDuLieu = useMemo(() => {
    if (!selectedLieuId) return []
    return commentaires
      .filter((c) => c.id_lieu === selectedLieuId && c.categorie === null)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [commentaires, selectedLieuId])

  const toggleFavori = async (idLieu) => {
    let error
    if (favoriIds.has(idLieu)) {
      ;({ error } = await supabase.from('favoris').update({ actif: false }).eq('pid', user.id).eq('id_entite', idLieu).eq('nom', 'lieu'))
    } else {
      ;({ error } = await supabase.from('favoris').upsert(
        { pid: user.id, id_entite: idLieu, nom: 'lieu', actif: true },
        { onConflict: 'pid,id_entite,nom' }
      ))
    }
    if (error) {
      alert("Impossible de mettre à jour ce favori : " + error.message)
      return
    }
    loadFavoris()
  }

  // Discussion libre — jamais de catégorie/couleur, distinct des tips.
  const handleAjouterCommentaire = async () => {
    if (!nouveauCommentaire.trim() || !selectedLieuId) return
    const { error } = await supabase.from('s_lieu_commentaire').insert({
      id_lieu: selectedLieuId,
      pid: user.id,
      contenu: nouveauCommentaire.trim(),
      categorie: null,
    })
    if (error) {
      alert("Impossible de publier ce commentaire : " + error.message)
      return
    }
    setNouveauCommentaire('')
    loadCommentaires()
  }

  const handleDeleteCommentaire = async (idCommentaire) => {
    await supabase.from('s_lieu_commentaire').delete().eq('id_commentaire', idCommentaire)
    loadCommentaires()
  }

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Activités et musées"
        requiredPlan="frequent"
        pricingOpen={pricingOpen}
        onPricingOpen={() => setPricingOpen(true)}
        onPricingClose={() => setPricingOpen(false)}
        onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
      />
    )
  }

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-5xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <div className="flex items-center justify-between gap-4 mb-2">
              <h1 className="font-serif text-3xl text-navy">Activités et musées</h1>
              <button onClick={() => setAddOpen(true)} className="btn-primary text-sm py-2.5 px-5 shrink-0">
                + Ajouter un lieu
              </button>
            </div>
            <p className="text-navy/70 mb-5">Coups de cœur, tips et arnaques à éviter — uniquement sur les lieux à visiter.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
              <select value={filtrePays} onChange={(e) => { setFiltrePays(e.target.value); setFiltreVille(''); setFiltreQuartier('') }} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Tous les pays</option>
                {paysConnus.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filtreVille} onChange={(e) => { setFiltreVille(e.target.value); setFiltreQuartier('') }} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Toutes les villes</option>
                {villesFiltrees.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={filtreQuartier} onChange={(e) => setFiltreQuartier(e.target.value)} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Quartier (facultatif)</option>
                {quartiersFiltres.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {selectedLieu && (
              <div ref={detailRef} className="bg-white border border-navy/10 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-navy/40 uppercase tracking-wide">Tips & conseils — {selectedLieu.nom}</p>
                  <button onClick={() => setCompleterLieu(selectedLieu)} className="text-xs text-navy/50 hover:text-navy underline">
                    Compléter le tips
                  </button>
                </div>

                {tipsDuLieu.length === 0 ? (
                  <p className="text-sm text-navy/40 py-4 text-center">Aucun tip pour l'instant.</p>
                ) : (
                  <div className="flex flex-col gap-3 mb-2">
                    {tipsDuLieu.map((c) => (
                      <div key={c.id_commentaire} className="flex items-start gap-2">
                        <CommentairePill categorie={c.categorie} />
                        <p className="text-sm text-navy/80">{c.contenu}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-navy/10 mt-3 pt-4">
                  <p className="text-sm font-medium text-navy mb-3">Discussion ({discussionDuLieu.length})</p>

                  <div className="flex flex-col gap-3 mb-4">
                    {discussionDuLieu.map((c) => {
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
                                  onClick={() => handleDeleteCommentaire(c.id_commentaire)}
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
                    {discussionDuLieu.length === 0 && (
                      <p className="text-xs text-navy/40">Aucun commentaire pour l'instant.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={nouveauCommentaire}
                      onChange={(e) => setNouveauCommentaire(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && nouveauCommentaire.trim()) handleAjouterCommentaire() }}
                      placeholder="Rebondir sur ce post"
                      className="flex-1 px-3 py-2 border border-navy/15 rounded-full text-xs focus:outline-none focus:border-coral"
                    />
                    <button
                      onClick={handleAjouterCommentaire}
                      disabled={!nouveauCommentaire.trim()}
                      className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                    >
                      Commenter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {lieuxFiltres.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Aucun lieu ne correspond à ces critères.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {lieuxFiltres.map((lieu, i) => (
                  <LieuCard
                    key={lieu.id_lieu}
                    lieu={lieu}
                    index={i}
                    isSelected={selectedLieuId === lieu.id_lieu}
                    onSelect={() => setSelectedLieuId(selectedLieuId === lieu.id_lieu ? null : lieu.id_lieu)}
                    isFavori={favoriIds.has(lieu.id_lieu)}
                    onToggleFavori={() => toggleFavori(lieu.id_lieu)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {addOpen && (
        <AjouterLieuModal userId={user.id} onClose={() => setAddOpen(false)} onCreated={() => { setAddOpen(false); loadLieux(); loadCommentaires() }} />
      )}
      {completerLieu && (
        <CompleterLieuModal
          lieu={completerLieu}
          userId={user.id}
          onClose={() => setCompleterLieu(null)}
          onUpdated={() => { setCompleterLieu(null); loadCommentaires() }}
        />
      )}
      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal
          onClose={() => setFavoritesOpen(false)}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={new Set(favoriteDeals.map((d) => `${d.type}:${d.id}`))}
          onToggleFavorite={toggleFavoriGeneric}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
    </>
  )
}
