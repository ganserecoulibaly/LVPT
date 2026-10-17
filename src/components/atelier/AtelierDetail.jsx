import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useFavoriLieuxPlatsSpas } from '../useFavoriLieuxPlatsSpas'
import Sidebar from '../Sidebar'
import PageHeader from '../PageHeader'
import EditProfileModal from '../EditProfileModal'
import PricingModal from '../PricingModal'
import FavoritesModal from '../FavoritesModal'
import ToolboxModal from '../ToolboxModal'
import Footer from '../Footer'

// Paiement unique via la fonction create-atelier-checkout : redirection
// vers Stripe Checkout, qui revient sur /ateliers/confirmation.
async function startCheckout(atelier, setPaying, setPayError) {
  setPayError('')
  setPaying(true)
  try {
    const { data, error } = await supabase.functions.invoke('create-atelier-checkout', {
      body: { atelierId: atelier.id_atelier },
    })
    if (error || !data?.url) {
      let detail = ''
      try { detail = (await error?.context?.json())?.detail || '' } catch { /* réponse non JSON */ }
      throw new Error(detail || error?.message || 'URL de paiement manquante')
    }
    window.location.href = data.url
  } catch (err) {
    console.error('Paiement atelier :', err)
    setPayError("Impossible de lancer le paiement : " + (err?.message || 'erreur inconnue'))
    setPaying(false)
  }
}

export default function AtelierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxPlatsSpas(user)
  const [atelier, setAtelier] = useState(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    supabase.from('d_atelier').select('*').eq('id_atelier', id).single()
      .then(({ data }) => setAtelier(data))
  }, [id])

  if (!user || !atelier) return null

  const lignes = (texte) => (texte || '').split('\n').filter(Boolean)
  const puces = lignes(atelier.description)
  const pourQui = lignes(atelier.pour_qui)
  const reparsAvec = lignes(atelier.repars_avec)

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-2xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <Link to="/ateliers" className="text-xs text-navy/50 hover:text-navy transition-colors mb-4 inline-block">
              ← Retour aux ateliers
            </Link>

            <div className="bg-white border border-navy/10 rounded-2xl p-6 sm:p-8">
              <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center mb-4">
                <i className={`ti ${atelier.icone} text-xl text-[#712B13]`} aria-hidden="true" />
              </div>

              <h1 className="font-serif text-2xl text-navy mb-3">{atelier.titre}</h1>

              {atelier.format && (
                <p className="text-xs text-navy/50 mb-4">{atelier.format}</p>
              )}
              {atelier.accroche && (
                <p className="text-sm text-navy/75 leading-relaxed mb-6">{atelier.accroche}</p>
              )}

              <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">{atelier.accroche ? 'Au programme' : 'Ce que tu apprends'}</p>
              <div className="flex flex-col gap-2 mb-6">
                {puces.map((puce, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-navy/75">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {puce}
                  </div>
                ))}
              </div>

              {pourQui.length > 0 && (
                <>
                  <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Pour qui ?</p>
                  <div className="flex flex-col gap-2 mb-6">
                    {pourQui.map((ligne, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-navy/75">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                        {ligne}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {reparsAvec.length > 0 && (
                <>
                  <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Tu repars avec</p>
                  <div className="flex flex-col gap-2 mb-6">
                    {reparsAvec.map((ligne, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-navy/75">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                        {ligne}
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="border-t border-navy/10 pt-5 flex items-center justify-between">
                <p className="text-2xl text-coral font-medium">{Number(atelier.prix).toFixed(0)}€</p>
                <button
                  onClick={() => startCheckout(atelier, setPaying, setPayError)}
                  disabled={paying || !atelier.stripe_price_id}
                  className="btn-primary text-sm py-2.5 px-6 disabled:opacity-60"
                >
                  {paying ? 'Redirection…' : 'Réserver ma session'}
                </button>
              </div>
              {payError && <p className="text-xs text-red-600 mt-3">{payError}</p>}
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
