import React, { useState, useMemo } from 'react'

// Seuils de rentabilité (en centimes / mile ou point) par programme.
// En dessous du premier seuil : le billet payé en euros est plus avantageux.
// Entre les deux seuils : valeur correcte (dépend de comment les miles/points ont été obtenus).
// Au-dessus du second seuil : le billet payé en miles/points est clairement avantageux.
const PROGRAMS = {
  flyingblue: {
    label: 'Flying Blue',
    unitLabel: 'miles',
    low: 0.7,
    high: 1.3,
  },
  avios: {
    label: 'Avios (Iberia)',
    unitLabel: 'Avios',
    low: 1.2,
    high: 1.5,
  },
  turkish: {
    label: 'Turkish Airlines (Miles&Smiles)',
    unitLabel: 'miles',
    low: 0.7,
    high: 1,
  },
}

function getVerdict(valueCts, program) {
  if (valueCts < program.low) {
    return {
      level: 'euros',
      label: 'Billet en euros plus avantageux',
      detail: `En dessous de ${program.low} ct/${program.unitLabel}, mieux vaut payer en euros et garder vos ${program.unitLabel}.`,
    }
  }
  if (valueCts <= program.high) {
    return {
      level: 'correct',
      label: 'Valeur correcte',
      detail: `Entre ${program.low} et ${program.high} ct/${program.unitLabel} — ça dépend surtout de la façon dont vous avez obtenu vos ${program.unitLabel} (gagnés facilement vs achetés).`,
    }
  }
  return {
    level: 'miles',
    label: 'Billet en miles clairement avantageux',
    detail: `Au-dessus de ${program.high} ct/${program.unitLabel}, l'échange est clairement en votre faveur.`,
  }
}

const verdictStyles = {
  euros: 'bg-red-50 border-red-200 text-red-700',
  correct: 'bg-amber-50 border-amber-200 text-amber-700',
  miles: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

export default function MilesVsEuros() {
  const [programKey, setProgramKey] = useState('flyingblue')
  const [prixEuros, setPrixEuros] = useState('')
  const [taxesMiles, setTaxesMiles] = useState('')
  const [nombreMiles, setNombreMiles] = useState('')

  const program = PROGRAMS[programKey]

  const result = useMemo(() => {
    const prix = parseFloat(prixEuros)
    const taxes = parseFloat(taxesMiles)
    const miles = parseFloat(nombreMiles)

    if (!isFinite(prix) || !isFinite(taxes) || !isFinite(miles) || miles <= 0) {
      return null
    }

    // Formule : valeur du mile (centimes) = (Prix_euros - Taxes_miles) / Nombre_miles × 100
    const valueCts = ((prix - taxes) / miles) * 100
    return {
      valueCts,
      verdict: getVerdict(valueCts, program),
    }
  }, [prixEuros, taxesMiles, nombreMiles, program])

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4 sm:pl-72">
      <div className="max-w-xl mx-auto">
        <h1 className="font-serif text-2xl text-navy font-medium mb-1">Miles vs Euros</h1>
        <p className="text-sm text-navy/60 mb-8">
          Comparez un billet payé en miles/points à son équivalent en euros pour savoir si l'échange en vaut la peine.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-navy mb-2">Programme de fidélité</label>
          <select
            value={programKey}
            onChange={(e) => setProgramKey(e.target.value)}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            {Object.entries(PROGRAMS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Prix du billet en euros (Prix_euros)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={prixEuros}
              onChange={(e) => setPrixEuros(e.target.value)}
              placeholder="ex. 450"
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Taxes payées en cash sur le billet en {program.unitLabel} (Taxes_miles)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={taxesMiles}
              onChange={(e) => setTaxesMiles(e.target.value)}
              placeholder="ex. 80"
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Nombre de {program.unitLabel} demandés (Nombre_miles)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={nombreMiles}
              onChange={(e) => setNombreMiles(e.target.value)}
              placeholder="ex. 30000"
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </div>
        </div>

        {result && (
          <div className={`rounded-lg border px-4 py-4 ${verdictStyles[result.verdict.level]}`}>
            <div className="text-sm text-navy/50 mb-1">Valeur du {program.unitLabel.slice(0, -1) || program.unitLabel}</div>
            <div className="text-2xl font-medium mb-2">{result.valueCts.toFixed(2)} ct</div>
            <div className="font-medium mb-1">{result.verdict.label}</div>
            <div className="text-sm opacity-80">{result.verdict.detail}</div>
          </div>
        )}

        {!result && (
          <p className="text-sm text-navy/40 italic">
            Remplissez les trois champs pour voir la valeur de vos {program.unitLabel} et le verdict.
          </p>
        )}
      </div>
    </div>
  )
}
