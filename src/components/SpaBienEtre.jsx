import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const GRADIENTS = [
  'linear-gradient(135deg, #F0997B, #D85A30)',
  'linear-gradient(135deg, #7F77DD, #534AB7)',
  'linear-gradient(135deg, #5DCAA5, #0F6E56)',
  'linear-gradient(135deg, #ED93B1, #993556)',
]

const TYPE_LABELS = {
  spa_hotel: "Spa d'hôtel",
  thermes: 'Thermes',
  bain_thermal: 'Bain thermal',
  source_chaude: 'Source naturelle d\'eau chaude',
  hammam_hotel: "Hammam d'hôtel",
  onsen: 'Onsen',
  spa_nordique: 'Spa nordique',
  flottaison_cryo: 'Flottaison / Cryothérapie',
}

// isHighlighted : mis en évidence temporairement quand on arrive depuis
// "Mes favoris" via ?spa=<id> — ce module n'a pas de vrai panneau de
// détail (contrairement à Activités & musées avec ses tips), donc on se
// contente de scroller jusqu'à la carte et de la faire ressortir
// visuellement quelques secondes.
function SpaCard({ spa, index, isFavori, onToggleFavori, isHighlighted, cardRef }) {
  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl overflow-hidden transition-all ${
        isHighlighted ? 'border-2 border-coral ring-2 ring-coral/30' : 'border border-navy/10'
      }`}
    >
      <div className="h-20 flex items-center justify-center relative" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c-1 3-3 4-3 7a3 3 0 0 0 6 0c0-3-2-4-3-7Z" />
          <path d="M5 14c1.5 0 2 1 3.5 1s2-1 3.5-1 2 1 3.5 1 2-1 3.5-1" />
          <path d="M4 19c1.5 0 2 1 3.5 1s2-1 3.5-1 2 1 3.5 1 2-1 3.5-1" />
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
      <div className="p-3.5">
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-coral/10 text-[#712B13] mb-1.5">
          {TYPE_LABELS[spa.type_spa] || spa.type_spa}
        </span>
        <p className="text-sm font-medium text-navy mb-0.5 truncate">{spa.nom}</p>
        <p className="text-[11px] text-navy/50 mb-2 truncate">
          {spa.ville}{spa.quartier ? ` — ${spa.quartier}` : ''}, {spa.pays}
        </p>
        {spa.description && (
          <p className="text-xs text-navy/60 mb-2 line-clamp-2">{spa.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {spa.prix_indicatif ? (
            <span className="text-xs text-coral font-medium">{spa.prix_indicatif}</span>
          ) : <span />}
          {spa.lien_resa && (
            <a href={spa.lien_resa} target="_blank" rel="noopener noreferrer" className="text-[11px] text-navy underline underline-offset-2">
              Voir l'offre ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SpaBienEtre() {
  const { user, allowed } = usePlanAccess('free')
  const [searchParams, setSearchParams] = useSearchParams()
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxPlatsSpas(user)
  const [spas, setSpas] = useState([])
  const [favoriIds, setFavoriIds] = useState(new Set())
  const [filtreType, setFiltreType] = useState('')
  const [filtrePays, setFiltrePays] = useState('')
  const [filtreVille, setFiltreVille] = useState('')
  const [highlightedSpaId, setHighlightedSpaId] = useState(null)
  const highlightedCardRef = useRef(null)

  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadSpas = () => {
    supabase.from('s_spa').select('*').eq('actif', true).order('created_at', { ascending: false })
      .then(({ data }) => setSpas(data || []))
  }

  const loadFavoris = () => {
    if (!user) return
    supabase.from('favoris').select('id_entite').eq('pid', user.id).eq('nom', 'spa').eq('actif', true)
      .then(({ data }) => setFavoriIds(new Set((data || []).map((f) => f.id_entite))))
  }

  useEffect(() => { loadSpas() }, [])
  useEffect(() => { loadFavoris() }, [user])

  useEffect(() => {
    const spaId = searchParams.get('spa')
    if (!spaId || spas.length === 0) return
    const exists = spas.some((s) => s.id_spa === spaId)
    if (exists) {
      setHighlightedSpaId(spaId)
      searchParams.delete('spa')
      setSearchParams(searchParams, { replace: true })
    }
  }, [spas, searchParams, setSearchParams])

  useEffect(() => {
    if (highlightedSpaId && highlightedCardRef.current) {
      highlightedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const timeout = setTimeout(() => setHighlightedSpaId(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [highlightedSpaId])

  const paysConnus = useMemo(() => [...new Set(spas.map((s) => s.pays))].sort(), [spas])
  const villesFiltrees = useMemo(() => {
    const source = filtrePays ? spas.filter((s) => s.pays === filtrePays) : spas
    return [...new Set(source.map((s) => s.ville))].sort()
  }, [spas, filtrePays])

  const spasFiltres = useMemo(() => {
    return spas.filter((s) => {
      if (filtreType && s.type_spa !== filtreType) return false
      if (filtrePays && s.pays !== filtrePays) return false
      if (filtreVille && s.ville !== filtreVille) return false
      return true
    })
  }, [spas, filtreType, filtrePays, filtreVille])

  const toggleFavori = async (idSpa) => {
    let error
    if (favoriIds.has(idSpa)) {
      ;({ error } = await supabase.from('favoris').update({ actif: false }).eq('pid', user.id).eq('id_entite', idSpa).eq('nom', 'spa'))
    } else {
      ;({ error } = await supabase.from('favoris').upsert(
        { pid: user.id, id_entite: idSpa, nom: 'spa', actif: true },
        { onConflict: 'pid,id_entite,nom' }
      ))
    }
    if (error) {
      alert("Impossible de mettre à jour ce favori : " + error.message)
      return
    }
    loadFavoris()
  }

  if (!user || allowed === null) return null

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

            <h1 className="font-serif text-3xl text-navy mb-2">Spa & bien-être</h1>
            <p className="text-navy/70 mb-6">Une pause détente, où que tu sois — même sans partir en voyage.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
              <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Tous les types</option>
                {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={filtrePays} onChange={(e) => { setFiltrePays(e.target.value); setFiltreVille('') }} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Tous les pays</option>
                {paysConnus.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)} className="px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                <option value="">Toutes les villes</option>
                {villesFiltrees.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {spasFiltres.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Aucun spa ne correspond à ces critères.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {spasFiltres.map((spa, i) => (
                  <SpaCard
                    key={spa.id_spa}
                    spa={spa}
                    index={i}
                    isFavori={favoriIds.has(spa.id_spa)}
                    onToggleFavori={() => toggleFavori(spa.id_spa)}
                    isHighlighted={highlightedSpaId === spa.id_spa}
                    cardRef={highlightedSpaId === spa.id_spa ? highlightedCardRef : null}
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

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal
          onClose={() => setFavoritesOpen(false)}
          favoriteDeals={favoriLieuxEtPlats}
          userId={user.id}
          favoriteIds={new Set(favoriLieuxEtPlats.map((d) => `${d.type}:${d.id}`))}
          onToggleFavorite={toggleFavoriGeneric}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
    </>
  )
}