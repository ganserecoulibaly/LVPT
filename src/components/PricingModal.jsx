import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const MONTHLY = 'monthly'
const YEARLY = 'yearly'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    description:
      'Pour découvrir Le Voyage Pas à Pas gratuitement.',
    badge: null,
    monthly: 0,
    yearly: 0,
    cta: 'Plan actuel',
    stripe: false,
    features: [
      'Recherche de vols',
      'Recherche d’hébergements',
      'Création de voyages',
      'Voyage Commun',
    ],
  },

  {
    id: 'occasionnel',
    name: 'Voyageur occasionnel',
    badge: 'Populaire',
    description:
      'Pour les voyageurs qui partent quelques fois par an.',

    monthly: 4.90,
    yearly: 49,

    stripe: true,

    cta: 'Choisir Voyageur occasionnel',

    features: [
      'Carnets illimités',
      'Favoris illimités',
      'Budget de voyage',
      'Checklist',
      'Documents de voyage',
      'Partage des voyages',
      'Support prioritaire',
    ],
  },

  {
    id: 'grand',
    name: 'Grand Voyageur',

    description:
      'Pour ceux qui voyagent toute l’année.',

    monthly: 8.90,
    yearly: 89,

    stripe: true,

    cta: 'Choisir Grand Voyageur',

    features: [
      'Toutes les fonctionnalités Occasionnel',
      'IA Voyage Premium',
      'Statistiques avancées',
      'Synchronisation multi-appareils',
      'Mode hors connexion',
      'Export PDF',
      'Accès anticipé aux nouveautés',
    ],
  },
]

const STRIPE_PRODUCTS = {
  occasionnel: {
    monthly: '',
    yearly: '',
  },

  grand: {
    monthly: '',
    yearly: '',
  },
}

function formatPrice(plan, billing) {
  if (plan.id === 'free') {
    return {
      price: '0 €',
      period: '',
    }
  }

  if (billing === MONTHLY) {
    return {
      price: `${plan.monthly.toFixed(2).replace('.', ',')} €`,
      period: '/mois',
    }
  }

  return {
    price: `${plan.yearly.toFixed(2).replace('.', ',')} €`,
    period: '/an',
  }
}

function startCheckout(planId, billing) {
  const product = STRIPE_PRODUCTS[planId]

  console.log('Stripe Checkout')

  console.log({
    plan: planId,
    billing,
    priceId:
      billing === MONTHLY
        ? product?.monthly
        : product?.yearly,
  })

  /*
      ICI :

      const { data } = await supabase.functions.invoke(...)

      window.location.href = data.url

  */
}

export default function PricingModal({
  onClose,
  onSelectPlan,
}) {
  const [billing, setBilling] =
    useState(MONTHLY)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const onEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      onEscape
    )

    return () => {
      document.body.style.overflow = ''

      window.removeEventListener(
        'keydown',
        onEscape
      )
    }
  }, [onClose])

  const plans = useMemo(
    () =>
      PLANS.map((plan) => ({
        ...plan,
        ...formatPrice(plan, billing),
      })),
    [billing]
  )

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-navy/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-7xl rounded-3xl bg-white shadow-2xl p-10 animate-scaleIn"
      >

                <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-navy/40 transition hover:bg-gray-100 hover:text-navy"
          aria-label="Fermer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mx-auto max-w-3xl text-center">

          <h2 className="font-serif text-4xl text-navy">
            Choisis ton abonnement
          </h2>

          <p className="mt-3 text-navy/60">
            Tu peux changer de formule à tout moment.
          </p>

        </div>

        <div className="mt-10 flex justify-center">

          <div className="relative inline-flex rounded-full bg-[#F4F2EF] p-1">

            <div
              className={`absolute top-1 bottom-1 rounded-full bg-white shadow transition-all duration-300 ${
                billing === MONTHLY
                  ? 'left-1 w-[calc(50%-4px)]'
                  : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
              }`}
            />

            <button
              onClick={() => setBilling(MONTHLY)}
              className={`relative z-10 rounded-full px-8 py-3 text-sm font-medium transition ${
                billing === MONTHLY
                  ? 'text-navy'
                  : 'text-navy/50 hover:text-navy'
              }`}
            >
              Mensuel
            </button>

            <button
              onClick={() => setBilling(YEARLY)}
              className={`relative z-10 rounded-full px-8 py-3 text-sm font-medium transition ${
                billing === YEARLY
                  ? 'text-navy'
                  : 'text-navy/50 hover:text-navy'
              }`}
            >
              Annuel

              <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                -17%
              </span>
            </button>

          </div>

        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">

          {plans.map((plan) => (

            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                plan.badge
                  ? 'border-coral shadow-lg'
                  : 'border-gray-200'
              }`}
            >

              {plan.badge && (
                <div className="absolute -top-4 left-8">

                  <span className="rounded-full bg-coral px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>

                </div>
              )}

              <h3 className="mt-2 font-serif text-2xl text-navy">
                {plan.name}
              </h3>

              <p className="mt-2 min-h-[52px] text-sm leading-6 text-navy/60">
                {plan.description}
              </p>

              <div className="mt-8">

                <span className="text-5xl font-semibold text-navy">
                  {plan.price}
                </span>

                <span className="ml-2 text-navy/50">
                  {plan.period}
                </span>

              </div>

              <div className="mt-8 h-px bg-gray-200" />

              <ul className="mt-8 flex flex-1 flex-col gap-4">

                                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-navy/80"
                  >
                    <svg
                      className="mt-0.5 shrink-0 text-coral"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">

                {plan.id === 'free' ? (

                  <button
                    className="w-full rounded-full border border-navy/20 py-3 font-medium text-navy transition hover:bg-navy hover:text-white"
                    onClick={() => {
                      onSelectPlan?.('free')
                      onClose()
                    }}
                  >
                    Continuer gratuitement
                  </button>

                ) : (

                  <button
                    onClick={() => {
                      startCheckout(
                        plan.id,
                        billing
                      )

                      onSelectPlan?.(plan.id)
                    }}
                    className="btn-primary w-full py-3"
                  >
                    {plan.cta}
                  </button>

                )}

              </div>

              {plan.id !== 'free' && (

                <p className="mt-4 text-center text-xs text-navy/45">
                  Paiement sécurisé avec Stripe
                </p>

              )}

            </div>

          ))}

        </div>

        <div className="mt-14 rounded-2xl bg-[#F7F5F2] p-8">

          <div className="grid gap-8 lg:grid-cols-3">

            <div>

              <h4 className="font-serif text-lg text-navy">
                Annulation
              </h4>

              <p className="mt-2 text-sm leading-6 text-navy/60">
                Tu peux résilier ton abonnement à
                tout moment. Aucun engagement.
              </p>

            </div>

            <div>

              <h4 className="font-serif text-lg text-navy">
                Paiement sécurisé
              </h4>

              <p className="mt-2 text-sm leading-6 text-navy/60">
                Les paiements sont réalisés via
                Stripe. Tes données bancaires ne
                transitent jamais par LVPT.
              </p>

            </div>

            <div>

              <h4 className="font-serif text-lg text-navy">
                Changement de formule
              </h4>

              <p className="mt-2 text-sm leading-6 text-navy/60">
                Passe d'un abonnement à un autre
                en un clic depuis ton tableau de
                bord.
              </p>

            </div>

          </div>

        </div>
              </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn .20s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn .25s ease-out;
        }

        @media (max-width: 1024px) {

          .animate-scaleIn {
            max-width: 760px;
          }

        }

        @media (max-width: 768px) {

          .animate-scaleIn {
            max-width: 100%;
          }

        }

      `}</style>

    </div>,
    document.body
  )
}
