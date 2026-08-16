import React from 'react'
import Sidebar from './Sidebar'
import PricingModal from './PricingModal'

const PLAN_LABELS = {
  occasional: 'Voyageur occasionnel',
  frequent: 'Grand Voyageur',
}

// Écran affiché à la place du contenu d'une page premium quand le
// plan de l'utilisateur ne le débloque pas — Sidebar reste visible
// (cohérent avec le reste de l'app), pricingOpen géré ici.
export default function PlanLockedScreen({ title, requiredPlan, pricingOpen, onPricingOpen, onPricingClose, onToolboxClick }) {
  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar onLockedClick={onPricingOpen} onToolboxClick={onToolboxClick} />
        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <p className="font-serif text-2xl text-navy mb-2">{title}</p>
            <p className="text-navy/60 mb-6">
              Cette fonctionnalité fait partie du plan {PLAN_LABELS[requiredPlan] || requiredPlan} et au-dessus.
            </p>
            <button onClick={onPricingOpen} className="btn-primary text-sm py-2.5 px-6">
              Voir les plans
            </button>
          </div>
        </div>
      </div>
      {pricingOpen && <PricingModal onClose={onPricingClose} />}
    </>
  )
}
