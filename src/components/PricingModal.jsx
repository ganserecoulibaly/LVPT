import React from 'react'
import { createPortal } from 'react-dom'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: '',
    description: 'Pour découvrir le carnet de voyage.',
    features: [
      'Recherche de vols & hébergements',
      'Voyage Commun',
    ],
    highlighted: false,
  },
  {
    id: 'occasional',
    name: 'Voyageur occasionnel',
    price: '—',
    period: '/mois',
    description: 'Pour ceux qui partent quelques fois par an.',
    features: [
      'Fonctionnalité à définir',
      'Fonctionnalité à définir',
      'Fonctionnalité à définir',
    ],
    highlighted: true,
  },
  {
    id: 'frequent',
    name: 'Grand Voyageur',
    price: '—',
    period: '/mois',
    description: 'Pour ceux qui voyagent toute l\'année.',
    features: [
      'Fonctionnalité à définir',
      'Fonctionnalité à définir',
      'Fonctionnalité à définir',
    ],
    highlighted: false,
  },
]

export default function PricingModal({ onClose, onSelectPlan }) {
  const handleSelect = (planId) => {
    // TODO : brancher la vraie logique de changement de plan (paiement, etc.)
    if (onSelectPlan) onSelectPlan(planId)
    else console.log('Plan sélectionné :', planId)
  }

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-4xl relative m-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="font-serif text-2xl text-navy text-center mb-2">
          Choisis ton plan
        </p>
        <p className="text-sm text-navy/55 text-center mb-8">
          Change à tout moment selon tes besoins de voyage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-2 border-coral bg-coral/5'
                  : 'border border-navy/10'
              }`}
            >
              {plan.highlighted && (
                <span className="self-start text-xs font-medium text-coral bg-coral/15 px-2.5 py-1 rounded-full mb-3">
                  Populaire
                </span>
              )}

              <p className="font-serif text-lg text-navy mb-1">{plan.name}</p>
              <p className="text-xs text-navy/55 mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-2xl font-medium text-navy">{plan.price}</span>
                <span className="text-sm text-navy/50">{plan.period}</span>
              </div>

              <ul className="flex-1 flex flex-col gap-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy/70">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                className={
                  plan.highlighted
                    ? 'btn-primary w-full text-sm py-2.5'
                    : 'w-full text-sm py-2.5 rounded-full border border-navy/15 text-navy hover:bg-navy/5 transition-colors'
                }
              >
                Choisir {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
