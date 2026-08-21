import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient' // adapte ce chemin au vrai fichier de ton client Supabase

const MONTHLY = 'monthly'
const YEARLY = 'yearly'

// Fonctionnalités alignées sur les vrais modules de l'app (Sidebar.jsx),
// pas des fonctionnalités inventées qui n'existent pas dans LVPT.
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Pour découvrir le carnet de voyage.',
    badge: null,
    monthly: 0,
    yearly: 0,
    cta: 'Continuer gratuitement',
    stripe: false,
    features: [
      'Recherche de vols et hébergements',
      'Voyage commun',
      'Itinéraires (3 derniers publiés)',
    ],
  },
  {
    id: 'occasionnel',
    name: 'Voyageur occasionnel',
    badge: 'Populaire',
    description: 'Pour ceux qui partent quelques fois par an.',
    monthly: 4.90,
    yearly: 49,
    stripe: true,
    cta: 'Choisir Voyageur occasionnel',
    features: [
      'Tout Gratuit, en illimité',
      'Séjours',
      'Journal de dépenses',
      'Playlist du voyage',
      'Carnet gastronomique',
    ],
  },
  {
    id: 'grand',
    name: 'Grand Voyageur',
    badge: null,
    description: "Pour ceux qui voyagent toute l'année.",
    monthly: 8.90,
    yearly: 89,
    stripe: true,
    cta: 'Choisir Grand Voyageur',
    features: [
      'Tout Voyageur occasionnel',
      'Activités et musées',
      "Carnet d'hébergements",
      'Documents de transport',
    ],
  },
]

// PLANS[].id reste en français (aligné sur PRICE_IDS côté Stripe), mais
// lvpt.abonnement stocke les valeurs anglaises attendues par
// usePlanAccess.js / Sidebar.jsx (voir PLAN_MAP dans stripe-webhook).
// On fait le pont ici pour savoir quelle carte correspond au plan actuel.
const PLAN_ID_TO_ABONNEMENT = {
  free: 'free',
  occasionnel: 'occasional',
  grand: 'frequent',
}

function formatPrice(plan, billing) {
  if (plan.id === 'free') return { price: '0€', period: '' }

  if (billing === MONTHLY) {
    return { price: `${plan.monthly.toFixed(2).replace('.', ',')}€`, period: '/mois' }
  }

  const monthlyEquivalent = plan.yearly / 12
  return {
    price: `${monthlyEquivalent.toFixed(2).replace('.', ',')}€`,
    period: '/mois',
    annualNote: `${plan.yearly}€/an — économise ${(plan.monthly * 12 - plan.yearly).toFixed(2).replace('.', ',')}€`,
  }
}

async function startCheckout(planId, billing, setLoadingPlan) {
  try {
    setLoadingPlan(planId)

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan: planId, billing },
    })

    if (error || !data?.url) {
      throw error ?? new Error('URL de paiement manquante')
    }

    window.location.href = data.url
  } catch (err) {
    console.error('Erreur lors du lancement du paiement Stripe :', err)
    alert("Impossible de lancer le paiement pour le moment. Réessaie dans un instant.")
    setLoadingPlan(null)
  }
}

async function startCancelSubscription(setCanceling) {
  try {
    setCanceling(true)

    const { data, error } = await supabase.functions.invoke('create-portal-session')

    if (error || !data?.url) {
      throw error ?? new Error('URL du portail manquante')
    }

    window.location.href = data.url
  } catch (err) {
    console.error('Erreur lors de l\'ouverture du portail Stripe :', err)
    alert("Impossible d'ouvrir la gestion de l'abonnement pour le moment. Réessaie dans un instant.")
    setCanceling(false)
  }
}

export default function PricingModal({ onClose, onSelectPlan, currentPlan = 'free' }) {
  const [billing, setBilling] = useState(MONTHLY)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onEscape = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEscape)
    }
  }, [onClose])

  const plans = useMemo(
    () => PLANS.map((plan) => ({ ...plan, ...formatPrice(plan, billing) })),
    [billing]
  )

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-4xl relative m-auto"
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

        <p className="font-serif text-2xl text-navy text-center mb-1">Choisis ton plan</p>
        <p className="text-sm text-navy/55 text-center mb-6">
          Change à tout moment selon tes besoins de voyage.
        </p>

        <div className="flex justify-center mb-8">
          <div className="relative inline-flex rounded-full bg-navy/5 p-1">
            <div
              className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ${
                billing === MONTHLY ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
              }`}
            />
            <button
              onClick={() => setBilling(MONTHLY)}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-medium transition-colors ${
                billing === MONTHLY ? 'text-navy' : 'text-navy/50 hover:text-navy'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling(YEARLY)}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                billing === YEARLY ? 'text-navy' : 'text-navy/50 hover:text-navy'
              }`}
            >
              Annuel
              <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = PLAN_ID_TO_ABONNEMENT[plan.id] === currentPlan

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-5 ${
                  isCurrent
                    ? 'border-2 border-navy/30 bg-navy/[0.03]'
                    : plan.badge
                      ? 'border-2 border-coral bg-coral/5'
                      : 'border border-navy/10'
                }`}
              >
                {isCurrent ? (
                  <span className="self-start text-xs font-medium text-navy bg-navy/10 px-2.5 py-1 rounded-full mb-3">
                    Ton plan actuel
                  </span>
                ) : plan.badge && (
                  <span className="self-start text-xs font-medium text-coral bg-coral/15 px-2.5 py-1 rounded-full mb-3">
                    {plan.badge}
                  </span>
                )}

                <p className="font-serif text-lg text-navy mb-1">{plan.name}</p>
                <p className="text-xs text-navy/55 mb-4 min-h-[32px]">{plan.description}</p>

                <div className="mb-1">
                  <span className="text-2xl font-medium text-navy">{plan.price}</span>
                  <span className="text-sm text-navy/50">{plan.period}</span>
                </div>
                <p className="text-[11px] text-green-700 mb-4 h-4">{plan.annualNote || ''}</p>

                <ul className="flex-1 flex flex-col gap-2 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-navy/70">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full text-sm py-2.5 rounded-full border border-navy/15 text-navy/40 cursor-default"
                  >
                    Ton plan actuel
                  </button>
                ) : plan.id === 'free' ? (
                  <button
                    onClick={() => {
                      if (currentPlan !== 'free') {
                        // L'utilisateur a un abonnement payant actif : "Continuer
                        // gratuitement" doit déclencher une vraie résiliation,
                        // pas juste fermer le modal.
                        if (window.confirm('Résilier ton abonnement ? Tu garderas l\'accès jusqu\'à la fin de la période en cours, puis ton compte repassera en Gratuit.')) {
                          startCancelSubscription(setCanceling)
                        }
                      } else {
                        onSelectPlan?.('free')
                        onClose()
                      }
                    }}
                    disabled={canceling}
                    className="w-full text-sm py-2.5 rounded-full border border-navy/15 text-navy hover:bg-navy/5 transition-colors disabled:opacity-60"
                  >
                    {canceling ? 'Ouverture du portail…' : plan.cta}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startCheckout(plan.id, billing, setLoadingPlan)}
                      disabled={loadingPlan === plan.id}
                      className="btn-primary w-full text-sm py-2.5 disabled:opacity-60"
                    >
                      {loadingPlan === plan.id ? 'Redirection…' : plan.cta}
                    </button>
                    <p className="text-center text-[11px] text-navy/40 mt-2">Paiement sécurisé avec Stripe</p>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {currentPlan !== 'free' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                if (window.confirm('Résilier ton abonnement ? Tu garderas l\'accès jusqu\'à la fin de la période en cours, puis ton compte repassera en Gratuit.')) {
                  startCancelSubscription(setCanceling)
                }
              }}
              disabled={canceling}
              className="text-xs text-navy/45 hover:text-red-500 transition-colors disabled:opacity-60"
            >
              {canceling ? 'Ouverture du portail…' : 'Résilier mon abonnement'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
