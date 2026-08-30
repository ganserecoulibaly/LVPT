import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useFavoriLieuxPlatsSpas } from './useFavoriLieuxPlatsSpas'
import AjouterPlatModal from './AjouterPlatModal'

function PlatCard({ plat, score, isFavori, onToggleFavori, onVote, myVote, onClick }) {
  return (
    <div className="bg-white border border-navy/10 rounded-xl p-3 relative cursor-pointer hover:border-coral transition-colors" onClick={onClick}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavori() }}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center"
        aria-label="Favori"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={isFavori ? '#993556' : 'none'} stroke={isFavori ? '#993556' : '#712B13'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </button>
      <p className="text-sm font-medium text-navy mb-0.5 pr-7 truncate">{plat.nom_plat}</p>
      <p className="text-[11px] text-navy/50 truncate">{plat.nom_restaurant} · {plat.ville}, {plat.pays}</p>
      <p className="text-xs text-coral font-medium mt-1 mb-2.5">{plat.prix}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onVote(-1) }}
          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] ${myVote === -1 ? 'border-coral text-coral' : 'border-navy/15 text-navy/40'}`}
        >−</button>
        <span className="text-xs text-navy">{score}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onVote(1) }}
          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] ${myVote === 1 ? 'border-coral text-coral' : 'border-navy/15 text-navy/40'}`}
        >+</button>
      </div>
    </div>
  )
}

export default function Gastronomie() {
  const { user, allowed } = usePlanAccess('occasional')
  const navigate = useNavigate()
  const [plats, setPlats] = useState([])
  const [scores, setScores] = useState({})
  const [myVotes, setMyVotes] = useState({})
  const [favoriIds, setFavoriIds] = useState(new Set())
  const [filtrePays, setFiltrePays] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadPlats = () => {
    supabase.from('d_plat').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPlats(data || []))
  }

  const loadVotes = () => {
    supabase.from('votes').select('pid, id_entite, score').eq('nom', 'gastronomie')
      .then(({ data }) => {
        const scoreMap = {}
        const myVoteMap = {}
        ;(data || []).forEach((v) => {
          scoreMap[v.id_entite] = (scoreMap[v.id_entite] || 0) + v.score
          if (v.pid === user?.id) myVoteMap[v.id_entite] = v.score
        })
        setScores(scoreMap)
        setMyVotes(myVoteMap)
      })
  }

  const loadFavoris = () => {
    if (!user) return
    supabase.from('favoris').select('id_entite').eq('pid', user.id).eq('nom', 'plat').eq('actif', true)
      .then(({ data }) => setFavoriIds(new Set((data || []).map((f) => f.id_entite))))
  }

  useEffect(() => { loadPlats() }, [])
  useEffect(() => { loadVotes(); loadFavoris() }, [user])

  const paysConnus = useMemo(() => [...new Set(plats.map((p) => p.pays))].sort(), [plats])

  const { favoriLieuxEtPlats: favoriteDeals, toggleFavoriGeneric } = useFavoriLieuxEtPlats(user)
  const platsFiltres = useMemo(
    () => filtrePays ? plats.filter((p) => p.pays === filtrePays) : plats,
    [plats, filtrePays]
  )

  const handleVote = async (idPlat, value) => {
    if (!user) return
    if (myVotes[idPlat] !== undefined) {
      await supabase.from('votes').delete().eq('pid', user.id).eq('id_entite', idPlat).eq('nom', 'gastronomie')
    } else {
      await supabase.from('votes').upsert(
        { pid: user.id, id_entite: idPlat, nom: 'gastronomie', score: value },
        { onConflict: 'pid,id_entite,nom' }
      )
    }
    loadVotes()
  }

  const toggleFavori = async (idPlat) => {
    let error
    if (favoriIds.has(idPlat)) {
      ;({ error } = await supabase.from('favoris').update({ actif: false }).eq('pid', user.id).eq('id_entite', idPlat).eq('nom', 'plat'))
    } else {
      ;({ error } = await supabase.from('favoris').upsert(
        { pid: user.id, id_entite: idPlat, nom: 'plat', actif: true },
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
              <h1 className="font-serif text-3xl text-navy">Carnet gastronomique</h1>
              <button onClick={() => setAddOpen(true)} className="btn-primary text-sm py-2.5 px-5 shrink-0">
                + Ajouter un plat
              </button>
            </div>
            <p className="text-navy/70 mb-5">Les plats goûtés par la communauté — une idée de quoi manger avant d'y aller.</p>

            <select value={filtrePays} onChange={(e) => setFiltrePays(e.target.value)} className="w-56 px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white mb-6 focus:outline-none focus:border-coral">
              <option value="">Tous les pays</option>
              {paysConnus.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {platsFiltres.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Aucun plat ne correspond à ces critères.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {platsFiltres.map((plat) => (
                  <PlatCard
                    key={plat.id_plat}
                    plat={plat}
                    score={scores[plat.id_plat] || 0}
                    myVote={myVotes[plat.id_plat]}
                    isFavori={favoriIds.has(plat.id_plat)}
                    onToggleFavori={() => toggleFavori(plat.id_plat)}
                    onVote={(v) => handleVote(plat.id_plat, v)}
                    onClick={() => navigate(`/carnet-gastronomique/${plat.id_plat}`)}
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
        <AjouterPlatModal
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onCreated={(idPlat) => { setAddOpen(false); navigate(`/carnet-gastronomique/${idPlat}`) }}
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
