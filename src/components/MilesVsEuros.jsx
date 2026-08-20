import React, { useState, useMemo } from 'react'

// Seuils de rentabilité (en centimes / mile ou point) par programme.
// En dessous du premier seuil : le billet payé en euros est plus avantageux.
// Entre les deux seuils : valeur correcte (dépend de comment les miles/points ont été obtenus).
// Au-dessus du second seuil : le billet payé en miles/points est clairement avantageux.
const PROGRAMS = {
  flyingblue: {
    label: 'Flying Blue',
    shortLabel: 'FB',
    unitLabel: 'miles',
    low: 0.7,
    high: 1.3,
  },
  avios: {
    label: 'Avios (Iberia)',
    shortLabel: 'Avios',
    unitLabel: 'Avios',
    low: 1.2,
    high: 1.5,
  },
  turkish: {
    label: 'Miles&Smiles (Turkish)',
    shortLabel: 'M&S',
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
      detail: `En dessous de ${program.low} ct/mile, mieux vaut payer en euros et garder vos ${program.unitLabel}.`,
    }
  }
  if (valueCts <= program.high) {
    return {
      level: 'correct',
      label: 'Valeur correcte',
      detail: `Ça dépend de la façon dont vous avez obtenu vos ${program.unitLabel}`,
    }
  }
  return {
    level: 'miles',
    label: 'Billet en miles clairement avantageux',
    detail: `Au-dessus de ${program.high} ct/mile, l'échange est clairement en votre faveur.`,
  }
}

const verdictColors = {
  euros: { text: 'text-red-700', dot: 'bg-red-600' },
  correct: { text: 'text-amber-700', dot: 'bg-amber-500' },
  miles: { text: 'text-emerald-700', dot: 'bg-emerald-600' },
}

function Gauge({ valueCts, program }) {
  // Bornes visuelles de la jauge : un peu au-delà du seuil haut pour laisser
  // de la place au marqueur même sur une très bonne valeur.
  const max = Math.round((program.high + (program.high - program.low)) * 10) / 10
  const clamped = Math.max(0, Math.min(valueCts, max))
  const percent = (clamped / max) * 100
  const lowPercent = (program.low / max) * 100
  const highPercent = (program.high / max) * 100

  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full overflow-hidden bg-navy/10">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400"
          style={{ width: '100%' }}
        />
        <div
          className="absolute -top-1.5 w-4 h-4 rounded-full bg-white border-2 shadow"
          style={{
            left: `calc(${percent}% - 8px)`,
            borderColor: 'currentColor',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-navy/40 mt-1.5">
        <span>0</span>
        <span style={{ marginLeft: `calc(${lowPercent}% - 20px)` }}>{program.low} ct</span>
        <span style={{ marginLeft: `calc(${highPercent - lowPercent}% - 20px)` }}>{program.high} ct</span>
        <span>{max} ct</span>
      </div>
    </div>
  )
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

  const colors = result ? verdictColors[result.verdict.level] : null

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16 px-4 sm:pl-72">
      <div className="max-w-xl mx-auto">
        {/* Fil d'ariane */}
        <div className="flex items-center gap-2 text-sm text-navy/40 mb-6">
          <span>Miles</span>
          <span>›</span>
          <span>Miles vs Euros</span>
        </div>

        <h1 className="font-serif text-3xl text-navy font-bold mb-2">Miles vs Euros</h1>
        <p className="text-navy/50 mb-8">
          Comparez la valeur réelle de vos miles à un billet payé cash, programme par programme.
        </p>

        {/* Sélecteur de programme en pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(PROGRAMS).map(([key, p]) => {
            const active = key === programKey
            return (
              <button
                key={key}
                onClick={() => setProgramKey(key)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-navy text-white'
                    : 'bg-white text-navy border border-navy/15 hover:bg-navy/5'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Carte des inputs */}
        <div className="bg-white border border-navy/10 rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-navy/50 mb-2">Prix du billet en euros</label>
              <div className="flex items-center border border-navy/15 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-coral/40">
                <input
                  type="number"
                  inputMode="decimal"
                  value={prixEuros}
                  onChange={(e) => setPrixEuros(e.target.value)}
                  placeholder="95"
                  className="w-full text-lg text-navy outline-none"
                />
                <span className="text-navy/30 text-sm ml-1">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-navy/50 mb-2">Taxes d'aéroport</label>
              <div className="flex items-center border border-navy/15 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-coral/40">
                <input
                  type="number"
                  inputMode="decimal"
                  value={taxesMiles}
                  onChange={(e) => setTaxesMiles(e.target.value)}
                  placeholder="26"
                  className="w-full text-lg text-navy outline-none"
                />
                <span className="text-navy/30 text-sm ml-1">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-navy/50 mb-2">
                {program.unitLabel === 'Avios' ? 'Avios demandés' : 'Miles demandés'}
              </label>
              <div className="flex items-center border border-navy/15 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-coral/40">
                <input
                  type="number"
                  inputMode="decimal"
                  value={nombreMiles}
                  onChange={(e) => setNombreMiles(e.target.value)}
                  placeholder="30000"
                  className="w-full text-lg text-navy outline-none"
                />
                <span className="text-navy/30 text-sm ml-1">{program.shortLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte de résultat */}
        {result ? (
          <div className={`rounded-2xl border border-navy/5 p-6 ${colors.text}`} style={{ backgroundColor: '#F7F1E6' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Valeur obtenue</div>
                <div className="text-4xl font-serif font-bold">
                  {result.valueCts.toFixed(2)} <span className="text-xl font-sans font-normal">ct/mile</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full ${colors.dot} bg-opacity-15 flex items-center justify-center`}>
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
              </div>
            </div>

            <div className="mt-4">
              <div className="font-medium">{result.verdict.label}</div>
              <div className="text-sm opacity-70 mt-0.5">{result.verdict.detail}</div>
            </div>

            <Gauge valueCts={result.valueCts} program={program} />
          </div>
        ) : (
          <div className="bg-navy/5 rounded-2xl p-6 text-center text-sm text-navy/40 italic">
            Remplissez les trois champs pour voir la valeur de vos {program.unitLabel} et le verdict.
          </div>
        )}
      </div>
    </div>
  )
}
