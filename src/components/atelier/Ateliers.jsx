import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useFavoriLieuxPlatsSpas } from '../useFavoriLieuxPlatsSpas'
import Sidebar from '../Sidebar'
import PageHeader from '../PageHeader'
import EditProfileModal from '../EditProfileModal'
import PricingModal from '../PricingModal'
import FavoritesModal from '../FavoritesModal'
import ToolboxModal from '../ToolboxModal'
import Footer from '../Footer'

function AtelierCard({ atelier, onOpen }) {
  return (
    <div
      onClick={() => onOpen(atelier.id_atelier)}
      className="bg-white rounded-xl p-4 cursor-pointer border border-navy/10 hover:border-coral transition-colors"
    >
      {atelier.populaire && (
        <span className="bg-coral/10 text-[#712B13] text-[10px] px-2 py-0.5 rounded-md inline-block mb-2">
          Le plus demandé
        </span>
      )}
      <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center mb-2.5">
        <i className={`ti ${atelier.icone} text-[15px] text-[#712B13]`} aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-navy underline underline-offset-2 mb-1">{atelier.titre}</p>
      <p className="text-base text-coral font-medium">
        {Number(atelier.prix).toFixed(0)}€ <span className="text-xs text-navy/40 font-normal">/ session</span>
      </p>
    </div>
  )
}

export default function Ateliers() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxEtPlats(user)
  const [ateliers, setAteliers] = useState([])
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    supabase.from('d_atelier').select('*').eq('actif', true).order('ordre', { ascending: true })
      .then(({ data }) => setAteliers(data || []))
  }, [])

  if (!user) return null

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <h1 className="font-serif text-3xl text-navy mb-2">Nos ateliers</h1>
            <p className="text-navy/70 mb-8">
              Des sessions individuelles avec un expert voyage, à ton rythme.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ateliers.map((atelier) => (
                <AtelierCard key={atelier.id_atelier} atelier={atelier} onOpen={(id) => navigate(`/ateliers/${id}`)} />
              ))}
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
