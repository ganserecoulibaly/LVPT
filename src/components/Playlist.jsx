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
import { useFavoriLieuxEtPlats } from './useFavoriLieuxEtPlats'
import PlanLockedScreen from './PlanLockedScreen'

const GRADIENTS = [
  'linear-gradient(135deg, #F0997B, #D85A30)',
  'linear-gradient(135deg, #7F77DD, #534AB7)',
  'linear-gradient(135deg, #5DCAA5, #0F6E56)',
  'linear-gradient(135deg, #ED93B1, #993556)',
]

const PLATEFORMES = [
  { key: 'lien_spotify', label: 'Spotify' },
  { key: 'lien_youtube', label: 'YouTube' },
  { key: 'lien_apple_music', label: 'Apple Music' },
  { key: 'lien_deezer', label: 'Deezer' },
]

function MusiqueCard({ m, index }) {
  const liensDisponibles = PLATEFORMES.filter((p) => m[p.key])
  return (
    <div className="bg-white border border-navy/10 rounded-xl overflow-hidden">
      <div
        className="h-20 flex items-center justify-center"
        style={{ background: GRADIENTS[index % GRADIENTS.length] }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-medium text-navy mb-0.5 truncate">{m.titre}</p>
        <p className="text-xs text-navy/50 mb-2.5 truncate">{m.artiste}{m.pays ? ` · ${m.pays}` : ''}</p>
        {liensDisponibles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {liensDisponibles.map((p) => (
              <a
                key={p.key}
                href={m[p.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-[#712B13] hover:bg-coral/20 transition-colors"
              >
                {p.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-navy/30">Aucun lien renseigné</p>
        )}
      </div>
    </div>
  )
}

function AjouterMusiqueModal({ userId, onClose, onCreated }) {
  const [titre, setTitre] = useState('')
  const [artiste, setArtiste] = useState('')
  const [pays, setPays] = useState('')
  const [liens, setLiens] = useState({ lien_spotify: '', lien_youtube: '', lien_apple_music: '', lien_deezer: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!titre.trim() || !artiste.trim()) {
      setError('Renseigne au moins un titre et un artiste.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('s_musique').insert({
      pid: userId,
      titre: titre.trim(),
      artiste: artiste.trim(),
      pays: pays.trim() || null,
      lien_spotify: liens.lien_spotify.trim() || null,
      lien_youtube: liens.lien_youtube.trim() || null,
      lien_apple_music: liens.lien_apple_music.trim() || null,
      lien_deezer: liens.lien_deezer.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError("Impossible d'ajouter ce morceau pour le moment.")
      return
    }
    onCreated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1">Ajouter une musique</p>
        <p className="text-sm text-navy/55 mb-5">Fais découvrir un morceau aux autres voyageurs.</p>

        <div className="flex flex-col gap-2.5 mb-4">
          <input type="text" placeholder="Titre du morceau" value={titre} onChange={(e) => setTitre(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <input type="text" placeholder="Artiste" value={artiste} onChange={(e) => setArtiste(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <input type="text" placeholder="Pays (facultatif)" value={pays} onChange={(e) => setPays(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        </div>

        <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Liens (facultatifs)</p>
        <div className="flex flex-col gap-2.5 mb-5">
          {PLATEFORMES.map((p) => (
            <input
              key={p.key}
              type="url"
              placeholder={`Lien ${p.label}`}
              value={liens[p.key]}
              onChange={(e) => setLiens((prev) => ({ ...prev, [p.key]: e.target.value }))}
              className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce morceau'}
        </button>
      </div>
    </div>
  )
}

export default function Playlist() {
  const { user, allowed } = usePlanAccess('occasional')
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxEtPlats(user)
  const [musiques, setMusiques] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadMusiques = () => {
    supabase.from('s_musique').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setMusiques(data || []))
  }

  useEffect(() => { loadMusiques() }, [])

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Playlist du voyage"
        requiredPlan="occasional"
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

            <h1 className="font-serif text-3xl text-navy mb-2">Playlist du voyage</h1>
            <p className="text-navy/70 mb-6">Une ambiance sonore pour chaque destination — découvre la musique des pays visités par la communauté.</p>

            <button onClick={() => setAddOpen(true)} className="btn-primary text-sm py-2.5 px-5 mb-6">
              + Ajouter une musique
            </button>

            {musiques.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Aucun morceau partagé pour l'instant.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {musiques.map((m, i) => <MusiqueCard key={m.id_musique} m={m} index={i} />)}
              </div>
            )}
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {addOpen && (
        <AjouterMusiqueModal
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); loadMusiques() }}
        />
      )}
      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal onClose={() => setFavoritesOpen(false)} favoriteDeals={favoriLieuxEtPlats} userId={user.id} favoriteIds={new Set(favoriLieuxEtPlats.map((d) => `${d.type}:${d.id}`))} onToggleFavorite={toggleFavoriGeneric} />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
    </>
  )
}
