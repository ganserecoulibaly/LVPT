import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

const PLAN_LABELS = {
  free: 'Gratuit',
  occasionnel: 'Voyageur occasionnel',
  grand: 'Grand Voyageur',
}

export default function PaymentSuccessModal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [planLabel, setPlanLabel] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('paiement') !== 'succes') return

    let cancelled = false
    let attempts = 0

    async function checkPlan() {
      attempts += 1
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data, error } = await supabase
        .from('lvpt')
        .select('abonnement')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      // Le webhook Stripe peut arriver après la redirection.
      // On retente jusqu'à 5 fois (10s max) tant que le plan est encore "free".
      if (!error && data && data.abonnement !== 'free') {
        setPlanLabel(PLAN_LABELS[data.abonnement] ?? data.abonnement)
        setShow(true)
      } else if (attempts < 5) {
        setTimeout(checkPlan, 2000)
      } else {
        // Après 10s, on affiche quand même un message générique
        // plutôt que de laisser l'utilisateur sans retour.
        setPlanLabel(null)
        setShow(true)
      }
    }

    checkPlan()
    return () => { cancelled = true }
  }, [searchParams])

  function handleClose() {
    setShow(false)
    // Nettoie l'URL pour éviter que le popup ne réapparaisse au refresh
    searchParams.delete('paiement')
    setSearchParams(searchParams, { replace: true })
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        {planLabel ? (
          <>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-semibold text-navy mb-2">
              Bienvenue sur {planLabel} !
            </h2>
            <p className="text-sm text-navy/70 mb-5">
              Ton abonnement est activé. Profite de toutes les nouvelles fonctionnalités dès maintenant.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-navy mb-2">
              Paiement reçu
            </h2>
            <p className="text-sm text-navy/70 mb-5">
              Ton paiement a bien été enregistré. Ton abonnement sera actif dans quelques instants — rafraîchis la page si besoin.
            </p>
          </>
        )}
        <button onClick={handleClose} className="btn-primary text-sm py-2.5 px-6">
          OK
        </button>
      </div>
    </div>
  )
}