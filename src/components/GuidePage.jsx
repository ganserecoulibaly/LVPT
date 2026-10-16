import React, { useState } from 'react'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import Footer from './Footer'
import { usePlanAccess } from './usePlanAccess'
import { useFavoriLieuxPlatsSpas } from './useFavoriLieuxPlatsSpas'
import { SECTIONS, PLAN_NAMES, COMING_SOON, EXAMPLE_POST, ADD_STEPS, ADD_INTRO, SEARCH_NOTE } from '../data/guideContent'

// Page /guide : même contenu que la pop-up de bienvenue, en détaillant
// chaque rubrique. Accessible depuis "Mon compte > Guide du site".
export default function GuidePage() {
  const { user } = usePlanAccess('free')
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxPlatsSpas(user)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  if (!user) return null

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-3xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <h1 className="font-serif text-3xl text-navy mb-2 text-center sm:text-left">Guide du site</h1>
            <p className="text-navy/70 mb-8 text-center sm:text-left">
              Ce que tu trouves dans chaque rubrique, et comment y ajouter du contenu.
            </p>

            <section className="bg-white rounded-2xl p-5 sm:p-6 mb-6">
              <h2 className="font-serif text-xl text-navy mb-3">Ajouter du contenu</h2>
              <p className="text-sm text-navy/60 mb-3">{ADD_INTRO}</p>
              <ol className="text-sm text-navy/80 mb-4 flex flex-col gap-1.5">
                {ADD_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-coral/10 text-coral text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-xl bg-cream border border-navy/10 px-4 py-3">
                <p className="text-xs text-navy/50 mb-2">Exemple : « Ajouter un post Le Comptoir Voyage »</p>
                {EXAMPLE_POST.map(([label, value]) => (
                  <p key={label} className="text-sm text-navy/80 leading-snug mb-1 last:mb-0">
                    <span className="text-navy/50">{label} : </span>{value}
                  </p>
                ))}
              </div>
              <p className="text-xs text-navy/50 mt-3">{SEARCH_NOTE}</p>
              <p className="text-xs text-navy/50 mt-1">
                Tu peux modifier ou supprimer ce que tu as publié depuis « Mon compte &gt; Mes contenus ».
              </p>
            </section>

            {['free', 'occasional', 'frequent'].map((plan) => (
              <section key={plan} className="mb-6">
                <h2 className="font-serif text-xl text-navy mb-3">
                  Plan {PLAN_NAMES[plan]}
                </h2>
                <div className="flex flex-col gap-3">
                  {SECTIONS.filter((s) => s.plan === plan).map((s) => (
                    <div key={s.nom} className="bg-white rounded-2xl p-4 sm:p-5">
                      <p className="font-medium text-navy mb-1">{s.nom}</p>
                      <p className="text-sm text-navy/70 mb-2">{s.contenu}</p>
                      <p className="text-xs text-navy/50">
                        {s.ajout
                          ? <>{s.envoi ? 'Pour envoyer ta recherche' : 'Pour ajouter'} : bouton « + » &gt; <span className="text-navy/70">{s.ajout}</span></>
                          : 'Contenu géré par l’équipe : rien à renseigner de ton côté.'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <p className="text-sm text-navy/50">Bientôt disponibles : {COMING_SOON.join(', ')}.</p>
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
