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
import { useFavoriLieuxPlatsSpas } from './useFavoriLieuxPlatsSpas'
import PlanLockedScreen from './PlanLockedScreen'

const GRADIENTS = [
  'linear-gradient(135deg, #F0997B, #D85A30)',
  'linear-gradient(135deg, #7F77DD, #534AB7)',
  'linear-gradient(135deg, #5DCAA5, #0F6E56)',
  'linear-gradient(135deg, #ED93B1, #993556)',
]

// Icône affichée selon le moyen de transport — 'Vol' par défaut si non
// reconnu (nouvelle valeur ajoutée plus tard sans casser l'affichage).
const TRANSPORT_ICONS = {
  Vol: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Train: <path d="M4 3h16v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V3zM4 11h16M8 21l-2 2M16 21l2 2M7.5 15.5h.01M16.5 15.5h.01" />,
  Voiture: <path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 12l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M3 12v4a1 1 0 0 0 1 1h1M21 12v4a1 1 0 0 0-1 1h-1" />,
  Bus: <path d="M4 17h16M6 17v2M18 17v2M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9H4V6zM4 11h16" />,
}

function formatDateCourte(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function SejourCard({ sejour, index }) {
  const transport = sejour.moyen_transport || 'Vol'
  const hebergement = sejour.type_hebergement || 'Hébergement'

  return (
    <div className="bg-white border border-navy/10 rounded-xl overflow-hidden">
      <div
        className="h-20 flex items-end p-2.5"
        style={{ background: GRADIENTS[index % GRADIENTS.length] }}
      >
        <span className="bg-white/90 text-[#712B13] text-[10px] px-2 py-1 rounded-md">
          {transport} + {hebergement}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-medium text-navy mb-0.5">{sejour.ville}, {sejour.pays}</p>
        <p className="text-xs text-navy/50 mb-2.5">
          {sejour.nb_nuits} nuit{sejour.nb_nuits > 1 ? 's' : ''} · {formatDateCourte(sejour.date_debut)} → {formatDateCourte(sejour.date_fin)}
        </p>
        <div className="flex flex-col gap-1 mb-2.5">
          {sejour.compagnie_transport && (
            <div className="flex items-center gap-1.5 text-[11px] text-navy/60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {TRANSPORT_ICONS[transport] || TRANSPORT_ICONS.Vol}
              </svg>
              {sejour.compagnie_transport}
            </div>
          )}
          {sejour.nom_hebergement && (
            <div className="flex items-center gap-1.5 text-[11px] text-navy/60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>
              {sejour.nom_hebergement}{sejour.type_hebergement ? ` · ${sejour.type_hebergement}` : ''}
            </div>
          )}
        </div>
        <div className="border-t border-navy/5 pt-2 flex items-center justify-between">
          <p className="text-base text-coral font-medium">{Number(sejour.prix_personne).toFixed(0)}€</p>
          {sejour.lien_offre ? (
            <a href={sejour.lien_offre} target="_blank" rel="noopener noreferrer" className="text-[11px] text-navy underline underline-offset-2">
              Voir l'offre ↗
            </a>
          ) : (
            <span className="text-[11px] text-navy/30">OffreÒ indisponible</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Sejours() {
  const { user, allowed } = usePlanAccess('occasional')
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxPlatsSpas(user)
  const [sejours, setSejours] = useState([])
  const [destination, setDestination] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [duree, setDuree] = useState('')
  const [triPar, setTriPar] = useState('prix_asc')
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  useEffect(() => {
    supabase.from('d_sejour').select('*').eq('actif', true)
      .then(({ data }) => setSejours(data || []))
  }, [])

  const destinations = useMemo(() => {
    const villes = [...new Set(sejours.map((s) => `${s.ville}, ${s.pays}`))]
    return villes.sort()
  }, [sejours])

  const filtered = useMemo(() => {
    let result = sejours.filter((s) => {
      if (destination && `${s.ville}, ${s.pays}` !== destination) return false
      if (budgetMax && Number(s.prix_personne) > Number(budgetMax)) return false
      if (duree) {
        const [min, max] = duree.split('-').map(Number)
        if (s.nb_nuits < min || (max && s.nb_nuits > max)) return false
      }
      return true
    })

    result.sort((a, b) => {
      if (triPar === 'prix_asc') return a.prix_personne - b.prix_personne
      if (triPar === 'prix_desc') return b.prix_personne - a.prix_personne
      if (triPar === 'date') return new Date(a.date_debut) - new Date(b.date_debut)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return result
  }, [sejours, destination, budgetMax, duree, triPar])

  const resetFiltres = () => {
    setDestination('')
    setBudgetMax('')
    setDuree('')
    setTriPar('prix_asc')
  }

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Séjours"
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
          <div className="max-w-6xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <h1 className="font-serif text-3xl text-navy mb-2">Séjours</h1>
            <p className="text-navy/70 mb-8">Vol + hébergement combinés, sélectionnés pour toi.</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="mb-4">
                  <label className="text-xs text-navy/50 mb-1 block">Destination</label>
                  <select value={destination} onChange={(e) => setDestination(e.target.value)} className="search-input bg-white">
                    <option value="">Toutes les destinations</option>
                    {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-navy/50 mb-1 block">Budget max / pers.</label>
                  <input
                    type="number" min="0" placeholder="ex : 400"
                    value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                    className="search-input bg-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-navy/50 mb-1 block">Durée</label>
                  <select value={duree} onChange={(e) => setDuree(e.target.value)} className="search-input bg-white">
                    <option value="">Peu importe</option>
                    <option value="2-3">2-3 nuits</option>
                    <option value="4-6">4-6 nuits</option>
                    <option value="7-">7 nuits et plus</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-navy/50 mb-1 block">Trier par</label>
                  <select value={triPar} onChange={(e) => setTriPar(e.target.value)} className="search-input bg-white">
                    <option value="prix_asc">Prix croissant</option>
                    <option value="prix_desc">Prix décroissant</option>
                    <option value="date">Départ le plus proche</option>
                    <option value="recent">Plus récemment ajouté</option>
                  </select>
                </div>

                <button onClick={resetFiltres} className="text-xs text-coral hover:underline">
                  Réinitialiser les filtres
                </button>
              </div>

              <div className="lg:col-span-3">
                {filtered.length === 0 ? (
                  <p className="text-sm text-navy/50 text-center py-16">Aucun séjour ne correspond à ces critères.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((sejour, i) => (
                      <SejourCard key={sejour.id_sejour} sejour={sejour} index={i} />
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
