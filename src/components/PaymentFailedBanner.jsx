import React from 'react'

async function openBillingPortal(supabase) {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session')
    if (error || !data?.url) throw error ?? new Error('URL du portail manquante')
    window.open(data.url, '_blank')
  } catch (err) {
    console.error('Erreur lors de l\'ouverture du portail de facturation :', err)
    alert("Impossible d'ouvrir la facturation pour le moment. Réessaie dans un instant.")
  }
}

export default function PaymentFailedBanner({ supabase }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-red-700">
        Ton dernier paiement n'a pas pu être traité. Mets à jour ton moyen de paiement pour garder l'accès à ton abonnement.
      </p>
      <button
        onClick={() => openBillingPortal(supabase)}
        className="text-sm font-medium text-red-700 hover:text-red-900 underline shrink-0"
      >
        Mettre à jour ma carte
      </button>
    </div>
  )
}
