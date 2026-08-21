import React from 'react'
import { useSearchParams } from 'react-router-dom'

export default function CancellationConfirmedModal() {
  const [searchParams, setSearchParams] = useSearchParams()

  const periodEndParam = searchParams.get('fin')
  const periodEndDate = periodEndParam
    ? new Date(Number(periodEndParam) * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  function handleClose() {
    searchParams.delete('resiliation')
    searchParams.delete('fin')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-navy mb-2">
          Résiliation prise en compte
        </h2>
        <p className="text-sm text-navy/70 mb-5">
          {periodEndDate
            ? `Tu gardes l'accès à ton plan actuel jusqu'au ${periodEndDate}. Ton compte repassera ensuite automatiquement en Gratuit.`
            : "Tu gardes l'accès à ton plan actuel jusqu'à la fin de la période en cours. Ton compte repassera ensuite automatiquement en Gratuit."}
        </p>
        <button onClick={handleClose} className="btn-primary text-sm py-2.5 px-6">
          OK
        </button>
      </div>
    </div>
  )
}
