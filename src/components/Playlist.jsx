import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import Footer from './Footer'
import { usePlanAccess } from './usePlanAccess'
import { useFavoriLieuxPlatsSpas } from './useFavoriLieuxPlatsSpas'
import PlanLockedScreen from './PlanLockedScreen'
import AjouterMusiqueModal from './AjouterMusiqueModal'

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

function MusiqueCard(props) {
  const m = props.m
  const index = props.index
  const liensDisponibles = PLATEFORMES.filter(function (p) {
    return m[p.key]
  })

  return (
    <div className="bg-white border border-navy/10 rounded-xl overflow-hidden">
      <div
        className="h-20 flex items-center justify-center"
        style={{ background: GRADIENTS[index % GRADIENTS.length] }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-medium text-navy mb-0.5 truncate">{m.titre}</p>
        <p className="text-xs text-navy/50 mb-2.5 truncate">
          {m.artiste}
          {m.pays ? ' · ' + m.pays : ''}
        </p>
        {liensDisponibles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {liensDisponibles.map(function (p) {
              return (
                <a
                  key={p.key}
                  href={m[p.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-1 rounded-full bg-coral/10 text-[#712B13] hover:bg-coral/20 transition-colors"
                >
                  {p.label}
                </a>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-navy/30">Aucun lien renseigné</p>
        )}
      </div>
    </div>
  )
}

export default function Playlist() {
  const planAccess = usePlanAccess('occasional')
  const user = planAccess.user
  const allowed = planAccess.allowed

  const favData = useFavoriLieuxPlatsSpas(user)
  const favoriLieuxEtPlats = favData.favoriLieuxEtPlats
  const toggleFavoriGeneric = favData.toggleFavoriGeneric

  const [musiques, setMusiques] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  function loadMusiques() {
    supabase
      .from('s_musique')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function (res) {
        setMusiques(res.data || [])
      })
  }

  useEffect(function () {
    loadMusiques()
  }, [])

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Playlist du voyage"
        requiredPlan="occasional"
        pricingOpen={pricingOpen}
        onPricingOpen={function () { setPricingOpen(true) }}
        onPricingClose={function () { setPricingOpen(false) }}
        onToolboxClick={function (tab) { setToolboxTab(tab); setToolboxOpen(true) }}
      />
    )
  }

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={function () { setPricingOpen(true) }}
          onToolboxClick={function (tab) { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-5xl mx-auto">
            <PageHeader
              onFavoritesClick={function () { setFavoritesOpen(true) }}
              onUpgradeClick={function () { setPricingOpen(true) }}
              onProfileClick={function () { setProfileOpen(true) }}
            />

            <h1 className="font-serif text-3xl text-navy mb-2">Playlist du voyage</h1>
            <p className="text-navy/70 mb-6">
              Une ambiance sonore pour chaque destination — découvre la musique des pays visités par la communauté.
            </p>

            <button onClick={function () { setAddOpen(true) }} className="btn-primary text-sm py-2.5 px-5 mb-6">
              + Ajouter une musique
            </button>

            {musiques.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Aucun morceau partagé pour l'instant.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {musiques.map(function (m, i) {
                  return <MusiqueCard key={m.id_musique} m={m} index={i} />
                })}
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
          onClose={function () { setAddOpen(false) }}
          onCreated={function () { setAddOpen(false); loadMusiques() }}
        />
      )}
      {pricingOpen && <PricingModal onClose={function () { setPricingOpen(false) }} />}
      {favoritesOpen && (
        <FavoritesModal
          onClose={function () { setFavoritesOpen(false) }}
          favoriteDeals={favoriLieuxEtPlats}
          userId={user.id}
          favoriteIds={new Set(favoriLieuxEtPlats.map(function (d) { return d.type + ':' + d.id }))}
          onToggleFavorite={toggleFavoriGeneric}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={function () { setToolboxOpen(false) }} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={function () { setProfileOpen(false) }} />}
    </>
  )
}
