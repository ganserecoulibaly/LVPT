import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import EditProfileModal from './EditProfileModal'

export default function DefisCommunaute() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(null) // null = chargement en cours
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  if (!user || isAdmin === null) return null

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

            <h1 className="font-serif text-3xl text-navy mb-6">Défis de la communauté</h1>

            {isAdmin ? (
              <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center">
                <p className="text-sm text-navy/50">Bientôt disponible.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center">
                <p className="text-sm text-navy/50">Cette section n'est pas encore accessible.</p>
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
          favoriteDeals={[]}
          userId={user.id}
          favoriteIds={new Set()}
          onToggleFavorite={() => {}}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
    </>
  )
}
