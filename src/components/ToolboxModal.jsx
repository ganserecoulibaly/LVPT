import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import plugData from '../data/plugData.json'
import timezoneCities from '../data/timezoneCities.json'
import emergencyData from '../data/emergencyData.json'
import visaLinks from '../data/visaLinks.json'
import countryCodes from '../data/countryCodes.json'
import drivingData from '../data/drivingData.json'

// Ces pays n'exigent pas de visa pour un séjour touristique français
// (espace Schengen / UE) — pas de lien nécessaire pour eux.
const NO_VISA_NEEDED = [
  'France', 'Italie', 'Espagne', 'Grèce', 'Portugal', 'Pays-Bas', 'Islande', 'Allemagne',
  'Suisse', 'Autriche', 'Irlande', 'Pologne', 'République tchèque', 'Hongrie', 'Croatie',
  'Suède', 'Norvège', 'Danemark', 'Finlande',
]

/* ---------- Icônes ---------- */
const icons = {
  currency: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 8h4a2 2 0 0 1 0 4H9m0 0h4a2 2 0 0 1 0 4H9m2-12v12"/></svg>,
  ruler: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 7v3M11 7v3M15 7v3"/></svg>,
  percent: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  suitcase: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 12h20"/></svg>,
  plug: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7V3M15 7V3"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7Z"/><path d="M12 17v4"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  cloud: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.3A6 6 0 1 0 7 16h11a4 4 0 0 0 0-8Z"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.4 12.4 0 0 0 .7 2.8 2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.4 12.4 0 0 0 2.8.7A2 2 0 0 1 22 16.9Z"/></svg>,
  passport: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>,
  language: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h7"/><path d="M9 3v2c0 4.4-2.7 8-6 8"/><path d="M5 9c0 2.5 2.3 4.5 6 5"/><path d="M14 20l4-9 4 9"/><path d="M15.5 17h5"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  tag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 12.6 12.7 20.5a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4 20.6 12.6Z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>,
  health: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 6v6c0 5 4 8 9 10 5-2 9-5 9-10V6l-9-4Z"/><path d="M12 8v6M9 11h6"/></svg>,
  car: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 17V11l2-5h14l2 5v6"/></svg>,
}

/* ---------- Convertisseur de devises ---------- */
// Source : fawazahmed0/currency-api, servie via CDN jsDelivr (et repli Cloudflare
// Pages en cas d'indisponibilité). Gratuite, sans clé, sans limite, et surtout :
// correctement accessible depuis un navigateur (contrairement à Frankfurter,
// qui bloque les requêtes via CORS — testé et confirmé).
const CURRENCY_API_PRIMARY = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'
const CURRENCY_API_FALLBACK = 'https://latest.currency-api.pages.dev/v1/currencies'

// Devises les plus utilisées dans les échanges internationaux et le voyage.
const COMMON_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'MXN',
  'THB', 'SGD', 'HKD', 'INR', 'KRW', 'TRY', 'ZAR', 'BRL', 'NZD',
  'SEK', 'NOK', 'DKK', 'PLN', 'ILS', 'IDR', 'MYR', 'PHP', 'CZK',
]

async function fetchCurrencyRates(fromCode) {
  const code = fromCode.toLowerCase()
  let response
  try {
    response = await fetch(`${CURRENCY_API_PRIMARY}/${code}.json`)
    if (!response.ok) throw new Error('primary failed')
  } catch {
    response = await fetch(`${CURRENCY_API_FALLBACK}/${code}.json`)
  }
  if (!response.ok) throw new Error('Réponse invalide')
  const data = await response.json()
  return { date: data.date, rates: data[code] }
}

function CurrencyConverter() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('EUR')
  const [to, setTo] = useState('USD')
  const [rates, setRates] = useState(null)
  const [rateDate, setRateDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCurrencyRates(from)
      .then(({ date, rates }) => {
        if (cancelled) return
        setRates(rates)
        setRateDate(date)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError("Taux indisponibles pour le moment — réessaie dans un instant.")
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [from])

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0
  const rate = rates?.[to.toLowerCase()]
  const result = rate != null ? numericAmount * rate : null

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="flex-1 px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        <select value={from} onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
          {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex justify-center mb-3">
        <button onClick={() => { setFrom(to); setTo(from) }}
          className="w-8 h-8 rounded-full border border-navy/15 flex items-center justify-center text-navy/60 hover:bg-navy/5 transition-colors" aria-label="Inverser">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 px-3 py-2.5 border border-navy/10 rounded-lg text-sm bg-navy/5 text-navy font-medium">
          {loading ? '…' : result != null ? result.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—'}
        </div>
        <select value={to} onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
          {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error ? (
        <p className="text-[11px] text-red-500 mt-2">{error}</p>
      ) : (
        <p className="text-[11px] text-navy/40 mt-2">
          Taux mis à jour quotidiennement{rateDate ? ` — au ${new Date(rateDate).toLocaleDateString('fr-FR')}` : ''}.
        </p>
      )}
    </div>
  )
}

/* ---------- Convertisseur d'unités ---------- */
const UNIT_TYPES = {
  distance: { label: 'Distance', from: 'km', to: 'miles', convert: (v) => v * 0.621371, reverse: (v) => v / 0.621371 },
  weight: { label: 'Poids', from: 'kg', to: 'lb', convert: (v) => v * 2.20462, reverse: (v) => v / 2.20462 },
  temperature: { label: 'Température', from: '°C', to: '°F', convert: (v) => v * 9 / 5 + 32, reverse: (v) => (v - 32) * 5 / 9 },
}

function makeSlots(conf, baseValue) {
  const numeric = parseFloat(String(baseValue).replace(',', '.')) || 0
  return [
    { key: 'from', unit: conf.from, value: String(baseValue) },
    { key: 'to', unit: conf.to, value: conf.convert(numeric).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) },
  ]
}

function UnitConverter() {
  const [type, setType] = useState('distance')
  const [slots, setSlots] = useState(() => makeSlots(UNIT_TYPES.distance, '10'))

  const handleTypeChange = (key) => {
    setType(key)
    setSlots(makeSlots(UNIT_TYPES[key], '10'))
  }

  const handleSlotChange = (index, raw) => {
    const conf = UNIT_TYPES[type]
    const other = index === 0 ? 1 : 0
    const n = parseFloat(raw.replace(',', '.'))
    const computed = isNaN(n)
      ? ''
      : (slots[index].key === 'from' ? conf.convert(n) : conf.reverse(n)).toLocaleString('fr-FR', { maximumFractionDigits: 2 })

    setSlots((current) => {
      const next = [...current]
      next[index] = { ...next[index], value: raw }
      next[other] = { ...next[other], value: computed }
      return next
    })
  }

  const swapSlots = () => setSlots(([a, b]) => [b, a])

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {Object.entries(UNIT_TYPES).map(([key, c]) => (
          <button key={key} onClick={() => handleTypeChange(key)}
            className={`flex-1 text-xs font-medium py-2 rounded-full border transition-colors ${
              type === key ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input type="text" inputMode="decimal" value={slots[0].value} onChange={(e) => handleSlotChange(0, e.target.value)}
          className="flex-1 px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        <span className="text-sm text-navy/50 w-14">{slots[0].unit}</span>
      </div>

      <div className="flex justify-center my-2">
        <button
          onClick={swapSlots}
          className="w-8 h-8 rounded-full border border-navy/15 flex items-center justify-center text-navy/60 hover:bg-navy/5 transition-colors"
          aria-label="Inverser l'ordre des unités"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input type="text" inputMode="decimal" value={slots[1].value} onChange={(e) => handleSlotChange(1, e.target.value)}
          className="flex-1 px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        <span className="text-sm text-navy/50 w-14">{slots[1].unit}</span>
      </div>

      <p className="text-[11px] text-navy/40 mt-2">Modifie n'importe quel champ, ou inverse l'ordre avec le bouton.</p>
    </div>
  )
}

/* ---------- Calculateur de pourboire ---------- */
const TIP_PRESETS = [
  { country: 'France', pct: 0, currency: 'EUR', note: 'Service inclus, pourboire optionnel' },
  { country: 'États-Unis', pct: 18, currency: 'USD', note: 'Quasi obligatoire' },
  { country: 'Japon', pct: 0, currency: 'JPY', note: 'Non pratiqué, peut être perçu comme gênant' },
  { country: 'Maroc', pct: 10, currency: 'MAD', note: 'Apprécié, pas obligatoire' },
  { country: 'Italie', pct: 0, currency: 'EUR', note: 'Souvent un "coperto" déjà facturé, pourboire non attendu' },
  { country: 'Espagne', pct: 5, currency: 'EUR', note: 'Rare, un arrondi suffit largement' },
  { country: 'Royaume-Uni', pct: 12, currency: 'GBP', note: 'Souvent déjà inclus en "service charge" — vérifier l\'addition' },
  { country: 'Thaïlande', pct: 10, currency: 'THB', note: 'Apprécié, mais jamais en pièces' },
  { country: 'Émirats arabes unis', pct: 10, currency: 'AED', note: 'Souvent déjà inclus, sinon environ 10%' },
  { country: 'Égypte', pct: 10, currency: 'EGP', note: 'Quasi systématique, y compris hors restaurant (bakchich)' },
  { country: 'Chine', pct: 0, currency: 'CNY', note: 'Non pratiqué, parfois perçu comme déplacé' },
  { country: 'Corée du Sud', pct: 0, currency: 'KRW', note: 'Non pratiqué, peut même vexer' },
  { country: 'Canada', pct: 18, currency: 'CAD', note: 'Quasi obligatoire, comme aux États-Unis' },
  { country: 'Mexique', pct: 12, currency: 'MXN', note: 'Attendu dans les restaurants touristiques' },
  { country: 'Australie', pct: 0, currency: 'AUD', note: 'Salaires décents inclus, pourboire rare' },
]

function TipCalculator() {
  const [bill, setBill] = useState('50')
  const [pct, setPct] = useState(15)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [rate, setRate] = useState(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState(null)

  const numericBill = parseFloat(bill.replace(',', '.')) || 0
  const tip = numericBill * (pct / 100)
  const total = numericBill + tip

  const preset = TIP_PRESETS.find((p) => p.country === selectedCountry)
  const localCurrency = preset?.currency

  const selectPreset = (p) => {
    setPct(p.pct)
    setSelectedCountry(p.country)
  }

  // Convertit le total (en devise locale, celle du pays choisi) vers l'euro,
  // pour donner une référence dans la devise du voyageur.
  useEffect(() => {
    if (!localCurrency || localCurrency === 'EUR') {
      setRate(null)
      return
    }
    let cancelled = false
    setRateLoading(true)
    setRateError(null)

    fetchCurrencyRates('EUR')
      .then(({ rates }) => {
        if (cancelled) return
        const r = rates[localCurrency.toLowerCase()]
        setRate(r ?? null)
        if (r == null) setRateError('Devise locale indisponible pour le moment.')
        setRateLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setRateError('Conversion indisponible pour le moment.')
        setRateLoading(false)
      })

    return () => { cancelled = true }
  }, [localCurrency])

  // `rate` = nombre d'unités de devise locale pour 1€. Le montant saisi étant
  // déjà en devise locale, on divise pour obtenir l'équivalent en euros.
  const convertedToEUR = rate != null ? total / rate : null

  return (
    <div>
      <label className="text-xs text-navy/50 mb-1 block">
        Montant de l'addition{localCurrency && localCurrency !== 'EUR' ? ` (en ${localCurrency})` : ''}
      </label>
      <input type="text" inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral mb-3" />

      <div className="flex flex-wrap gap-1.5 mb-3">
        {TIP_PRESETS.map((p) => (
          <button key={p.country} onClick={() => selectPreset(p)}
            className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${
              selectedCountry === p.country ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
            }`} title={p.note}>
            {p.country} ({p.pct}%)
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <input type="range" min="0" max="30" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="flex-1" />
        <div className="flex items-center gap-1 w-16">
          <input
            type="text"
            inputMode="decimal"
            value={pct}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'))
              setPct(isNaN(v) ? 0 : v)
            }}
            className="w-10 px-1.5 py-1 border border-navy/15 rounded text-sm text-right focus:outline-none focus:border-coral"
          />
          <span className="text-sm text-navy/60">%</span>
        </div>
      </div>

      <div className="px-3 py-2.5 rounded-lg bg-navy/5 text-sm text-navy">
        Pourboire : <span className="font-medium">
          {tip.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}{(!localCurrency || localCurrency === 'EUR') ? '€' : ''}
        </span>
        {' '}— Total : <span className="font-medium">
          {total.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}{(!localCurrency || localCurrency === 'EUR') ? '€' : ''}
        </span>
      </div>

      {preset && localCurrency && localCurrency !== 'EUR' && (
        <p className="text-[11px] text-navy/45 mt-2">
          {rateLoading && '≈ conversion en cours…'}
          {!rateLoading && convertedToEUR != null && (
            <>≈ {convertedToEUR.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}€ dans ta devise</>
          )}
          {!rateLoading && rateError && rateError}
        </p>
      )}
    </div>
  )
}

/* ---------- Checklist de valise (générique) ---------- */
const PACKING_ITEMS = [
  { category: 'Vêtements', items: ['Sous-vêtements', 'T-shirts', 'Pantalon / short', 'Pull ou veste', 'Chaussures de marche', 'Pyjama'] },
  { category: 'Toilette', items: ['Brosse à dents', 'Dentifrice', 'Déodorant', 'Crème solaire', 'Trousse de médicaments'] },
  { category: 'Documents', items: ['Passeport / CNI', 'Billets', 'Réservations hébergement', 'Assurance voyage', 'Argent / carte bancaire'] },
  { category: 'Électronique', items: ['Chargeur', 'Adaptateur prise', 'Batterie externe', 'Écouteurs'] },
  { category: 'Divers', items: ['Bouteille d\'eau réutilisable', 'Livre ou liseuse', 'Sac à dos jour'] },
]

function PackingChecklist() {
  const [checked, setChecked] = useState({})
  const toggle = (item) => setChecked((c) => ({ ...c, [item]: !c[item] }))
  const total = PACKING_ITEMS.reduce((sum, cat) => sum + cat.items.length, 0)
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div>
      <p className="text-xs text-navy/50 mb-3">{done} / {total} coché{done > 1 ? 's' : ''}</p>
      <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
        {PACKING_ITEMS.map((cat) => (
          <div key={cat.category}>
            <p className="text-xs font-medium text-navy/70 mb-1.5">{cat.category}</p>
            <div className="space-y-1">
              {cat.items.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                  <input type="checkbox" checked={!!checked[item]} onChange={() => toggle(item)} />
                  <span className={checked[item] ? 'line-through text-navy/40' : ''}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Prises électriques & voltage ---------- */
// Schémas simplifiés des broches par type de prise (pas des photos réelles,
// mais des représentations reconnaissables — évite toute question de droits).
const PLUG_PIN_LAYOUTS = {
  A: [{ x: 14, y: 12, w: 3, h: 12, shape: 'rect' }, { x: 23, y: 12, w: 3, h: 12, shape: 'rect' }],
  B: [{ x: 14, y: 10, w: 3, h: 11, shape: 'rect' }, { x: 23, y: 10, w: 3, h: 11, shape: 'rect' }, { x: 20, y: 26, r: 2, shape: 'circle' }],
  C: [{ x: 15, y: 16, r: 2.5, shape: 'circle' }, { x: 25, y: 16, r: 2.5, shape: 'circle' }],
  D: [{ x: 20, y: 10, r: 2.5, shape: 'circle' }, { x: 13, y: 24, r: 2.5, shape: 'circle' }, { x: 27, y: 24, r: 2.5, shape: 'circle' }],
  E: [{ x: 15, y: 14, r: 2.2, shape: 'circle' }, { x: 25, y: 14, r: 2.2, shape: 'circle' }, { x: 20, y: 25, r: 2.5, shape: 'circle', hollow: true }],
  F: [{ x: 15, y: 16, r: 2.5, shape: 'circle' }, { x: 25, y: 16, r: 2.5, shape: 'circle' }, { x: 9, y: 16, w: 2, h: 6, shape: 'rect' }, { x: 29, y: 16, w: 2, h: 6, shape: 'rect' }],
  G: [{ x: 20, y: 11, w: 3, h: 8, shape: 'rect' }, { x: 13, y: 24, w: 3, h: 8, shape: 'rect' }, { x: 27, y: 24, w: 3, h: 8, shape: 'rect' }],
  I: [{ x: 15, y: 12, w: 3, h: 10, shape: 'rect', rotate: -20 }, { x: 25, y: 12, w: 3, h: 10, shape: 'rect', rotate: 20 }, { x: 20, y: 27, w: 3, h: 8, shape: 'rect' }],
  L: [{ x: 20, y: 9, r: 2.3, shape: 'circle' }, { x: 20, y: 18, r: 2.3, shape: 'circle' }, { x: 20, y: 27, r: 2.3, shape: 'circle' }],
  M: [{ x: 20, y: 9, r: 3, shape: 'circle' }, { x: 12, y: 25, r: 3, shape: 'circle' }, { x: 28, y: 25, r: 3, shape: 'circle' }],
  N: [{ x: 15, y: 14, r: 2.3, shape: 'circle' }, { x: 25, y: 14, r: 2.3, shape: 'circle' }, { x: 20, y: 25, r: 2.3, shape: 'circle' }],
  H: [{ x: 20, y: 10, r: 2.3, shape: 'circle' }, { x: 14, y: 25, r: 2.3, shape: 'circle' }, { x: 26, y: 25, r: 2.3, shape: 'circle' }],
  J: [{ x: 20, y: 9, r: 2.2, shape: 'circle' }, { x: 20, y: 18, r: 2.2, shape: 'circle' }, { x: 20, y: 27, r: 2.2, shape: 'circle' }],
  K: [{ x: 15, y: 14, r: 2.3, shape: 'circle' }, { x: 25, y: 14, r: 2.3, shape: 'circle' }, { x: 20, y: 26, r: 2.5, shape: 'circle', hollow: true }],
}

function PlugIcon({ type }) {
  const pins = PLUG_PIN_LAYOUTS[type] || PLUG_PIN_LAYOUTS.C
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" className="shrink-0">
      <rect x="3" y="3" width="34" height="34" rx="17" fill="none" stroke="#1B2A41" strokeOpacity="0.15" strokeWidth="1.5" />
      {pins.map((p, i) =>
        p.shape === 'circle' ? (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.hollow ? 'none' : '#1B2A41'} stroke="#1B2A41" strokeWidth={p.hollow ? 1.5 : 0} opacity="0.75" />
        ) : (
          <rect
            key={i}
            x={p.x} y={p.y} width={p.w} height={p.h} rx="1"
            fill="#1B2A41" opacity="0.75"
            transform={p.rotate ? `rotate(${p.rotate} ${p.x + p.w / 2} ${p.y + p.h / 2})` : undefined}
          />
        )
      )}
      <text x="20" y="20" textAnchor="middle" dy="0.35em" fontSize="0" />
    </svg>
  )
}

const PLUG_COUNTRIES = Object.keys(plugData).sort((a, b) => a.localeCompare(b, 'fr'))

function PlugVoltageGuide() {
  const [country, setCountry] = useState('Japon')
  const data = plugData[country]

  return (
    <div>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3">
        {PLUG_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <div className="flex items-center justify-center gap-4 py-3">
        {data.types.map((t) => (
          <div key={t} className="flex flex-col items-center gap-1.5">
            <PlugIcon type={t} />
            <span className="text-xs font-medium text-navy">Type {t}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 rounded-lg bg-navy/5 flex justify-between text-sm mt-2">
        <span className="text-navy/60">Voltage</span>
        <span className="font-medium text-navy">{data.voltage}</span>
      </div>
    </div>
  )
}

/* ---------- Fuseaux horaires ---------- */
function TimezoneComparator() {
  const [cityA, setCityA] = useState('Paris')
  const [cityB, setCityB] = useState('Tokyo')
  const cities = Object.keys(timezoneCities).sort((a, b) => a.localeCompare(b, 'fr'))

  const format = (tz) => new Date().toLocaleTimeString('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-center">
        <select value={cityA} onChange={(e) => setCityA(e.target.value)}
          className="w-full px-2 py-2 border border-navy/15 rounded-lg text-sm bg-white mb-2">
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <p className="text-2xl font-serif text-navy">{format(timezoneCities[cityA])}</p>
      </div>
      <span className="text-navy/30">→</span>
      <div className="flex-1 text-center">
        <select value={cityB} onChange={(e) => setCityB(e.target.value)}
          className="w-full px-2 py-2 border border-navy/15 rounded-lg text-sm bg-white mb-2">
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <p className="text-2xl font-serif text-coral">{format(timezoneCities[cityB])}</p>
      </div>
    </div>
  )
}

/* ---------- Météo (en direct, via Open-Meteo — gratuite, sans clé) ---------- */
// Correspondance simplifiée des codes météo WMO renvoyés par Open-Meteo.
const WEATHER_CODES = {
  0: '☀️ Ciel dégagé', 1: '🌤️ Peu nuageux', 2: '⛅ Partiellement nuageux', 3: '☁️ Couvert',
  45: '🌫️ Brouillard', 48: '🌫️ Brouillard givrant',
  51: '🌦️ Bruine légère', 53: '🌦️ Bruine', 55: '🌦️ Bruine forte',
  61: '🌧️ Pluie légère', 63: '🌧️ Pluie', 65: '🌧️ Pluie forte',
  71: '🌨️ Neige légère', 73: '🌨️ Neige', 75: '🌨️ Neige forte',
  80: '🌦️ Averses légères', 81: '🌦️ Averses', 82: '⛈️ Averses fortes',
  95: '⛈️ Orage', 96: '⛈️ Orage avec grêle', 99: '⛈️ Orage violent avec grêle',
}
const weatherLabel = (code) => WEATHER_CODES[code] || 'Conditions variables'

async function geocodeCity(name) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=fr`)
  if (!res.ok) throw new Error('Recherche de ville indisponible')
  const data = await res.json()
  if (!data.results || data.results.length === 0) throw new Error('Ville introuvable — vérifie l\'orthographe')
  const r = data.results[0]
  return { lat: r.latitude, lon: r.longitude, label: `${r.name}, ${r.country}` }
}

async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&timezone=auto`
  )
  if (!res.ok) throw new Error('Météo indisponible pour le moment')
  return res.json()
}

// Climat de référence pour les 5 prochains mois : pas une prévision (impossible
// à cet horizon), mais les données réelles de la même période l'an dernier,
// à la même position géographique — un bien meilleur repère qu'une moyenne
// générique par pays.
async function fetchMonthlyClimate(lat, lon) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 6, 0)
  start.setFullYear(start.getFullYear() - 1)
  end.setFullYear(end.getFullYear() - 1)

  const fmt = (d) => d.toISOString().split('T')[0]
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
  )
  if (!res.ok) throw new Error('Climat indisponible pour cette ville')
  const data = await res.json()

  const byMonth = {}
  data.daily.time.forEach((date, i) => {
    const month = new Date(date).getMonth()
    if (!byMonth[month]) byMonth[month] = { maxSum: 0, minSum: 0, rainSum: 0, rainyDays: 0, count: 0 }
    const bucket = byMonth[month]
    bucket.maxSum += data.daily.temperature_2m_max[i]
    bucket.minSum += data.daily.temperature_2m_min[i]
    bucket.rainSum += data.daily.precipitation_sum[i] || 0
    if (data.daily.precipitation_sum[i] > 1) bucket.rainyDays += 1
    bucket.count += 1
  })

  const months = []
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const b = byMonth[d.getMonth()]
    if (!b) continue
    months.push({
      label: d.toLocaleDateString('fr-FR', { month: 'long' }),
      avgMax: Math.round(b.maxSum / b.count),
      avgMin: Math.round(b.minSum / b.count),
      rainMm: Math.round(b.rainSum),
      rainyDays: b.rainyDays,
    })
  }
  return months
}

function WeatherPreview() {
  const [city, setCity] = useState('Tokyo')
  const [data, setData] = useState(null)
  const [months, setMonths] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const weatherCities = Object.keys(timezoneCities).sort((a, b) => a.localeCompare(b, 'fr'))

  const handleSearch = async (targetCity) => {
    const query = targetCity ?? city
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    setMonths(null)
    try {
      const { lat, lon, label } = await geocodeCity(query)
      const [weather, climate] = await Promise.all([fetchWeather(lat, lon), fetchMonthlyClimate(lat, lon)])
      setData({ ...weather, label })
      setMonths(climate)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch('Tokyo') }, []) // charge Tokyo par défaut à l'ouverture

  return (
    <div>
      <select
        value={city}
        onChange={(e) => { setCity(e.target.value); handleSearch(e.target.value) }}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3"
      >
        {weatherCities.map((c) => <option key={c}>{c}</option>)}
      </select>

      {loading && <p className="text-xs text-navy/40 mb-2">Chargement…</p>}
      {error && <p className="text-[11px] text-red-500 mb-2">{error}</p>}

      {data && (
        <>
          <p className="text-xs text-navy/50 mb-2">{data.label} — actuellement</p>
          <div className="flex items-center gap-4 px-3 py-4 rounded-lg bg-navy/5 mb-4">
            <p className="text-3xl font-serif text-navy">{Math.round(data.current.temperature_2m)}°C</p>
            <p className="text-sm text-navy/70">{weatherLabel(data.current.weather_code)}</p>
          </div>
        </>
      )}

      {months && months.length > 0 && (
        <>
          <p className="text-xs font-medium text-navy/70 mb-2">Climat des 5 prochains mois</p>
          <div className="space-y-1.5">
            {months.map((m) => (
              <div key={m.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy/5 text-sm">
                <span className="text-navy capitalize">{m.label}</span>
                <span className="text-navy/70">{m.avgMin}° – {m.avgMax}°</span>
                <span className="text-[11px] text-navy/45">
                  {m.rainMm}mm · {m.rainyDays} j. de pluie
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-navy/40 mt-2">
            Basé sur les données réelles de l'an dernier à la même période — un repère, pas une prévision.
          </p>
        </>
      )}
    </div>
  )
}

/* ---------- Numéros d'urgence ---------- */
const EMERGENCY_COUNTRIES = Object.keys(emergencyData).sort((a, b) => a.localeCompare(b, 'fr'))

function EmergencyNumbers() {
  const [country, setCountry] = useState('Japon')
  const data = emergencyData[country]

  return (
    <div>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3">
        {EMERGENCY_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      {Object.entries(data.numbers).map(([label, number]) => (
        <div key={label} className="px-3 py-2.5 rounded-lg bg-navy/5 flex justify-between text-sm mb-2">
          <span className="text-navy/60">{label}</span>
          <span className="font-medium text-navy">{number}</span>
        </div>
      ))}

      {data.consulate ? (
        <div className="px-3 py-2.5 rounded-lg bg-coral/10 text-sm mt-3">
          <p className="text-navy/60 mb-1">Consulat de France</p>
          <p className="text-navy">{data.consulate.address}</p>
          <p className="text-navy font-medium mt-1">{data.consulate.phone}</p>
        </div>
      ) : (
        <p className="text-[11px] text-navy/40 mt-2">Pense aussi à noter le contact de l'ambassade française sur place.</p>
      )}
    </div>
  )
}

/* ---------- Jours fériés (via Nager.Date — API gratuite, sans clé) ---------- */
const HOLIDAY_COUNTRIES = Object.keys(countryCodes).sort((a, b) => a.localeCompare(b, 'fr'))

function PublicHolidays() {
  const [country, setCountry] = useState('Japon')
  const [holidays, setHolidays] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async (selectedCountry) => {
    setLoading(true)
    setError(null)
    setHolidays(null)
    try {
      const code = countryCodes[selectedCountry]
      const year = new Date().getFullYear()
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`)
      if (!res.ok) throw new Error('Non disponible pour ce pays')
      const data = await res.json()
      const today = new Date().toISOString().split('T')[0]
      setHolidays(data.filter((h) => h.date >= today).slice(0, 8))
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('Japon') }, [])

  return (
    <div>
      <select
        value={country}
        onChange={(e) => { setCountry(e.target.value); load(e.target.value) }}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3"
      >
        {HOLIDAY_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      {loading && <p className="text-xs text-navy/40">Chargement…</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {holidays && (
        holidays.length === 0 ? (
          <p className="text-sm text-navy/50">Aucun jour férié à venir cette année pour ce pays.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {holidays.map((h) => (
              <div key={h.date} className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy/5 text-sm">
                <span className="text-navy">{h.localName}</span>
                <span className="text-xs text-navy/50 shrink-0 ml-2">
                  {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

/* ---------- Convertisseur de tailles (vêtements & chaussures) ---------- */
const CLOTHING_SIZES_WOMEN = [
  { eu: 34, us: 2, uk: 6 }, { eu: 36, us: 4, uk: 8 }, { eu: 38, us: 6, uk: 10 },
  { eu: 40, us: 8, uk: 12 }, { eu: 42, us: 10, uk: 14 }, { eu: 44, us: 12, uk: 16 }, { eu: 46, us: 14, uk: 18 },
]
const CLOTHING_SIZES_MEN = [
  { label: 'XS', eu: 44, us: 'XS', uk: 'XS' }, { label: 'S', eu: 46, us: 'S', uk: 'S' },
  { label: 'M', eu: 48, us: 'M', uk: 'M' }, { label: 'L', eu: 50, us: 'L', uk: 'L' },
  { label: 'XL', eu: 52, us: 'XL', uk: 'XL' }, { label: 'XXL', eu: 54, us: 'XXL', uk: 'XXL' },
]
const SHOE_SIZES = [
  { eu: 35, uk: 2.5, usMen: 3, usWomen: 4.5, jp: 22 }, { eu: 36, uk: 3.5, usMen: 4, usWomen: 5.5, jp: 23 },
  { eu: 37, uk: 4, usMen: 5, usWomen: 6, jp: 23.5 }, { eu: 38, uk: 5, usMen: 6, usWomen: 7, jp: 24 },
  { eu: 39, uk: 6, usMen: 6.5, usWomen: 8, jp: 24.5 }, { eu: 40, uk: 6.5, usMen: 7.5, usWomen: 8.5, jp: 25 },
  { eu: 41, uk: 7.5, usMen: 8, usWomen: 9.5, jp: 26 }, { eu: 42, uk: 8, usMen: 9, usWomen: 10, jp: 26.5 },
  { eu: 43, uk: 9, usMen: 10, usWomen: 11, jp: 27.5 }, { eu: 44, uk: 9.5, usMen: 10.5, usWomen: 11.5, jp: 28 },
  { eu: 45, uk: 10.5, usMen: 11.5, usWomen: 12.5, jp: 29 }, { eu: 46, uk: 11, usMen: 12, usWomen: 13, jp: 29.5 },
]

function SizeConverter() {
  const [category, setCategory] = useState('shoes') // shoes | women | men

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {[
          { key: 'shoes', label: 'Chaussures' },
          { key: 'women', label: 'Vêtements femme' },
          { key: 'men', label: 'Vêtements homme' },
        ].map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`flex-1 text-[11px] font-medium py-2 rounded-full border transition-colors ${
              category === c.key ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {category === 'shoes' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-navy/40 uppercase">
                <th className="text-left pb-1.5">EU</th><th className="text-left pb-1.5">UK</th>
                <th className="text-left pb-1.5">US H</th><th className="text-left pb-1.5">US F</th><th className="text-left pb-1.5">JP</th>
              </tr>
            </thead>
            <tbody>
              {SHOE_SIZES.map((s) => (
                <tr key={s.eu} className="border-t border-navy/5">
                  <td className="py-1.5 font-medium text-navy">{s.eu}</td>
                  <td className="py-1.5 text-navy/70">{s.uk}</td>
                  <td className="py-1.5 text-navy/70">{s.usMen}</td>
                  <td className="py-1.5 text-navy/70">{s.usWomen}</td>
                  <td className="py-1.5 text-navy/70">{s.jp}cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {category === 'women' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-navy/40 uppercase">
                <th className="text-left pb-1.5">EU</th><th className="text-left pb-1.5">US</th><th className="text-left pb-1.5">UK</th>
              </tr>
            </thead>
            <tbody>
              {CLOTHING_SIZES_WOMEN.map((s) => (
                <tr key={s.eu} className="border-t border-navy/5">
                  <td className="py-1.5 font-medium text-navy">{s.eu}</td>
                  <td className="py-1.5 text-navy/70">{s.us}</td>
                  <td className="py-1.5 text-navy/70">{s.uk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {category === 'men' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-navy/40 uppercase">
                <th className="text-left pb-1.5">Taille</th><th className="text-left pb-1.5">EU</th>
                <th className="text-left pb-1.5">US</th><th className="text-left pb-1.5">UK</th>
              </tr>
            </thead>
            <tbody>
              {CLOTHING_SIZES_MEN.map((s) => (
                <tr key={s.label} className="border-t border-navy/5">
                  <td className="py-1.5 font-medium text-navy">{s.label}</td>
                  <td className="py-1.5 text-navy/70">{s.eu}</td>
                  <td className="py-1.5 text-navy/70">{s.us}</td>
                  <td className="py-1.5 text-navy/70">{s.uk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[11px] text-navy/40 mt-2">Les tailles varient selon les marques — à titre indicatif.</p>
    </div>
  )
}

/* ---------- Vaccins & recommandations sanitaires ---------- */
const HEALTH_COUNTRIES = Object.keys(countryCodes).sort((a, b) => a.localeCompare(b, 'fr'))

function HealthInfo() {
  const [country, setCountry] = useState('Japon')
  const searchLink = `https://www.google.com/search?q=site:diplomatie.gouv.fr+conseils+voyageurs+sant%C3%A9+${encodeURIComponent(country)}`

  return (
    <div>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3">
        {HEALTH_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <a href={searchLink} target="_blank" rel="noopener noreferrer"
        className="btn-primary w-full justify-center text-sm py-2.5 mb-2">
        Recommandations santé pour {country} ↗
      </a>
      <a href="https://www.pasteur.fr/fr/centre-medical/preparer-son-voyage" target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-coral hover:underline">
        Consultation voyageurs — Institut Pasteur ↗
      </a>

      <p className="text-[11px] text-navy/40 mt-3">
        Vaccinations recommandées, paludisme, eau potable... vérifie toujours ces informations avant de partir,
        idéalement 4 à 6 semaines avant le départ.
      </p>
    </div>
  )
}

/* ---------- Conduite à l'étranger ---------- */
const DRIVING_COUNTRIES = Object.keys(drivingData).sort((a, b) => a.localeCompare(b, 'fr'))

function DrivingInfo() {
  const [country, setCountry] = useState('Japon')
  const data = drivingData[country]

  return (
    <div>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3">
        {DRIVING_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <div className="px-3 py-3 rounded-lg bg-navy/5 flex justify-between text-sm mb-2">
        <span className="text-navy/60">Sens de circulation</span>
        <span className="font-medium text-navy capitalize">
          Conduite à {data.side} {data.side === 'gauche' ? '🚙⬅️' : '➡️🚙'}
        </span>
      </div>
      <div className="px-3 py-3 rounded-lg bg-navy/5 flex justify-between text-sm">
        <span className="text-navy/60">Permis international</span>
        <span className="font-medium text-navy">{data.permit}</span>
      </div>

      <p className="text-[11px] text-navy/40 mt-3">
        Informations à titre indicatif — vérifie toujours les conditions exactes avant de louer un véhicule.
      </p>
    </div>
  )
}

/* ---------- Visa : lien officiel du pays de destination ---------- */
const VISA_COUNTRIES = [...new Set([...Object.keys(visaLinks), ...NO_VISA_NEEDED])].sort((a, b) => a.localeCompare(b, 'fr'))

function VisaChecker() {
  const [destination, setDestination] = useState('Japon')
  const link = visaLinks[destination]
  const noVisaNeeded = NO_VISA_NEEDED.includes(destination)

  return (
    <div>
      <label className="text-xs text-navy/50 mb-1 block">Destination (pour un passeport français)</label>
      <select value={destination} onChange={(e) => setDestination(e.target.value)}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral mb-3">
        {VISA_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      {noVisaNeeded ? (
        <div className="px-3 py-2.5 rounded-lg bg-navy/5 text-sm text-navy/70">
          Aucun visa nécessaire pour un séjour touristique (espace Schengen / UE).
        </div>
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center text-sm py-2.5"
        >
          Voir les infos visa officielles ↗
        </a>
      ) : (
        <p className="text-[11px] text-navy/40">Pas encore de lien référencé pour ce pays.</p>
      )}

      <p className="text-[11px] text-navy/40 mt-3">
        Lien vers le site officiel du pays de destination — vérifie toujours les conditions d'entrée avant de partir.
      </p>
    </div>
  )
}

/* ---------- Traducteur (via MyMemory API — gratuite, sans clé) ---------- */
const LANGUAGE_CODES = {
  'Français': 'fr', 'Anglais': 'en', 'Espagnol': 'es', 'Portugais': 'pt',
  'Italien': 'it', 'Allemand': 'de', 'Néerlandais': 'nl', 'Grec': 'el',
  'Arabe': 'ar', 'Turc': 'tr', 'Russe': 'ru',
  'Japonais': 'ja', 'Coréen': 'ko', 'Chinois': 'zh', 'Thaï': 'th',
  'Vietnamien': 'vi', 'Indonésien': 'id', 'Hindi': 'hi',
}
const LANGUAGES = Object.keys(LANGUAGE_CODES)

async function translateText(text, from, to) {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
  )
  if (!res.ok) throw new Error('Traduction indisponible pour le moment')
  const data = await res.json()
  if (!data.responseData?.translatedText) throw new Error('Traduction indisponible pour le moment')
  return data.responseData.translatedText
}

function Translator() {
  const [sourceLang, setSourceLang] = useState('Français')
  const [targetLang, setTargetLang] = useState('Anglais')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    setError(null)
    setOutputText('')
    try {
      const result = await translateText(inputText, LANGUAGE_CODES[sourceLang], LANGUAGE_CODES[targetLang])
      setOutputText(result)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInputText(outputText)
    setOutputText('')
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="flex-1 px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white">
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button onClick={swapLanguages} className="text-navy/40 hover:text-navy transition-colors shrink-0" aria-label="Inverser">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="flex-1 px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white">
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Texte à traduire..." rows={3}
        className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral mb-3 resize-none" />
      <button onClick={handleTranslate} disabled={loading} className="btn-primary w-full justify-center text-sm py-2.5 mb-3 disabled:opacity-60">
        {loading ? 'Traduction en cours…' : 'Traduire'}
      </button>
      {error && <p className="text-[11px] text-red-500 mb-2">{error}</p>}
      {outputText && <div className="px-3 py-2.5 rounded-lg bg-navy/5 text-sm text-navy">{outputText}</div>}
    </div>
  )
}

/* ---------- Modale principale ---------- */
const TOOLS = [
  { id: 'driving', label: 'Conduite', icon: 'car', component: DrivingInfo },
  { id: 'currency', label: 'Devises', icon: 'currency', component: CurrencyConverter },
  { id: 'timezone', label: 'Fuseaux horaires', icon: 'clock', component: TimezoneComparator },
  { id: 'holidays', label: 'Jours fériés', icon: 'calendar', component: PublicHolidays },
  { id: 'weather', label: 'Météo', icon: 'cloud', component: WeatherPreview },
  { id: 'tip', label: 'Pourboire', icon: 'percent', component: TipCalculator },
  { id: 'plug', label: 'Prises & voltage', icon: 'plug', component: PlugVoltageGuide },
  { id: 'health', label: 'Santé', icon: 'health', component: HealthInfo },
  { id: 'sizes', label: 'Tailles', icon: 'tag', component: SizeConverter },
  { id: 'translate', label: 'Traducteur', icon: 'language', component: Translator },
  { id: 'units', label: 'Unités', icon: 'ruler', component: UnitConverter },
  { id: 'emergency', label: 'Urgences', icon: 'phone', component: EmergencyNumbers },
  { id: 'packing', label: 'Valise', icon: 'suitcase', component: PackingChecklist },
  { id: 'visa', label: 'Visa', icon: 'passport', component: VisaChecker },
]

export default function ToolboxModal({ onClose, initialTab = 'currency' }) {
  const [tab, setTab] = useState(initialTab)
  const ActiveTool = TOOLS.find((t) => t.id === tab)?.component || CurrencyConverter

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto"
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

        <p className="font-serif text-lg text-navy mb-1">La boîte à outils</p>
        <p className="text-sm text-navy/55 mb-5">Tes indispensables pour voyager sereinement.</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                tab === t.id ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
              }`}
            >
              {icons[t.icon]}
              {t.label}
            </button>
          ))}
        </div>

        <ActiveTool />
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
