import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient'

// Autocomplétion de lieu via Nominatim (OpenStreetMap) — gratuite, sans clé.
async function searchPlace(query) {
  if (!query || query.trim().length < 3) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
  )
  if (!res.ok) return []
  return res.json()
}

// Autocomplétion de pays via Nominatim, restreinte aux résultats de type "country".
async function searchCountry(query) {
  if (!query || query.trim().length < 2) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featureType=country&accept-language=fr&limit=5`
  )
  if (!res.ok) return []
  return res.json()
}

// Autocomplétion de ville via Nominatim, filtrée par pays si déjà renseigné.
async function searchCity(query, paysContext) {
  if (!query || query.trim().length < 2) return []
  const q = paysContext ? `${query}, ${paysContext}` : query
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&featureType=city&accept-language=fr&limit=5`
  )
  if (!res.ok) return []
  return res.json()
}

// Génère les créneaux horaires toutes les 30 minutes : "00h00", "00h30", ... "23h30"
const HEURE_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}h${m}`
})

const emptyStep = { nom_etape: '', lieu: '', adresse: '', heure: '', duree: '' }
const emptyDay = (numero) => ({ jour_numero: numero, titre: '', sous_titre: '', steps: [{ ...emptyStep }] })

// Petit label réutilisable avec astérisque rouge optionnel pour les champs obligatoires.
function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] font-medium text-navy/70 mb-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

export default function CreateItineraireModal({ userId, onClose, onCreated }) {
  const [titre, setTitre] = useState('')
  const [pays, setPays] = useState('')
  const [ville, setVille] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('sejour') // 'sejour' | 'journee'
  const [dureeHeures, setDureeHeures] = useState('')
  const [days, setDays] = useState([emptyDay(1)])
  const [suggestions, setSuggestions] = useState({}) // { "dayIdx-stepIdx": [...] }
  const [paysSuggestions, setPaysSuggestions] = useState([])
  const [villeSuggestions, setVilleSuggestions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Un timer par champ (indexé par clé : 'pays', 'ville', ou "dayIdx-stepIdx"
  // pour chaque lieu). Nominatim tolère 1 requête/seconde max — sans ce
  // délai de 400ms après la dernière frappe, chaque lettre tapée déclenchait
  // sa propre requête, au risque d'un blocage d'IP.
  const debounceTimers = useRef({})
  const DEBOUNCE_MS = 400
  const debounced = (key, fn) => {
    clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(fn, DEBOUNCE_MS)
  }

  const updateDay = (dayIdx, field, value) => {
    setDays((current) => {
      const next = [...current]
      next[dayIdx] = { ...next[dayIdx], [field]: value }
      return next
    })
  }

  const updateStep = (dayIdx, stepIdx, field, value) => {
    setDays((current) => {
      const next = [...current]
      const steps = [...next[dayIdx].steps]
      steps[stepIdx] = { ...steps[stepIdx], [field]: value }
      next[dayIdx] = { ...next[dayIdx], steps }
      return next
    })
  }

  const handlePaysChange = (value) => {
    setPays(value)
    debounced('pays', async () => {
      const results = await searchCountry(value)
      setPaysSuggestions(results)
    })
  }

  const selectPaysSuggestion = (place) => {
    setPays(place.display_name.split(',')[0])
    setPaysSuggestions([])
  }

  const handleVilleChange = (value) => {
    setVille(value)
    debounced('ville', async () => {
      const results = await searchCity(value, pays)
      setVilleSuggestions(results)
    })
  }

  const selectVilleSuggestion = (place) => {
    setVille(place.display_name.split(',')[0])
    setVilleSuggestions([])
  }

  const handleLieuChange = (dayIdx, stepIdx, value) => {
    updateStep(dayIdx, stepIdx, 'lieu', value)
    debounced(`${dayIdx}-${stepIdx}`, async () => {
      const results = await searchPlace(value)
      setSuggestions((s) => ({ ...s, [`${dayIdx}-${stepIdx}`]: results }))
    })
  }

  const selectSuggestion = (dayIdx, stepIdx, place) => {
    updateStep(dayIdx, stepIdx, 'lieu', place.display_name.split(',')[0])
    updateStep(dayIdx, stepIdx, 'adresse', place.display_name)
    setSuggestions((s) => ({ ...s, [`${dayIdx}-${stepIdx}`]: [] }))
  }

  const addDay = () => {
    setDays((current) => [...current, emptyDay(current.length + 1)])
  }
  const removeDay = (dayIdx) => {
    setDays((current) => current.filter((_, i) => i !== dayIdx))
  }
  const addStep = (dayIdx) => {
    setDays((current) => {
      const next = [...current]
      next[dayIdx] = { ...next[dayIdx], steps: [...next[dayIdx].steps, { ...emptyStep }] }
      return next
    })
  }
  const removeStep = (dayIdx, stepIdx) => {
    setDays((current) => {
      const next = [...current]
      next[dayIdx] = { ...next[dayIdx], steps: next[dayIdx].steps.filter((_, i) => i !== stepIdx) }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!titre.trim() || !pays.trim()) {
      setError('Le titre et le pays sont obligatoires.')
      return
    }
    if (format === 'journee' && !dureeHeures) {
      setError('Indique la durée en heures.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      const { data: itineraire, error: itError } = await supabase
        .from('s_itineraire')
        .insert({
          pid: userId,
          titre: titre.trim(),
          pays: pays.trim(),
          ville: ville.trim() || null,
          description: description.trim() || null,
          duree_totale_jour: format === 'sejour' ? days.length : null,
          duree_totale_heure: format === 'journee' ? Number(dureeHeures) : null,
        })
        .select()
        .single()
      if (itError) throw itError

      for (const day of days) {
        const { data: jourRow, error: jourError } = await supabase
          .from('s_itineraire_jour')
          .insert({
            id_itineraire: itineraire.id_itineraire,
            jour_numero: day.jour_numero,
            titre: day.titre.trim() || null,
            sous_titre: day.sous_titre.trim() || null,
          })
          .select()
          .single()
        if (jourError) throw jourError

        const stepRows = day.steps
          .filter((s) => s.nom_etape.trim())
          .map((s, i) => ({
            id_jour: jourRow.id_jour,
            no_ordre: i + 1,
            nom_etape: s.nom_etape.trim(),
            lieu: s.lieu.trim() || null,
            adresse: s.adresse.trim() || null,
            heure: s.heure.trim() || null,
            duree: s.duree.trim() || null,
          }))

        if (stepRows.length > 0) {
          const { error: stepsError } = await supabase.from('s_itineraire_step').insert(stepRows)
          if (stepsError) throw stepsError
        }
      }

      onCreated?.()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue, réessaie.')
    } finally {
      setSaving(false)
    }
  }

  const modalContent = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-xl relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="font-serif text-lg text-navy mb-4">Créer un itinéraire</p>

        <FieldLabel required>Titre</FieldLabel>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex: 12 jours au Vietnam"
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-2 focus:outline-none focus:border-coral" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <div className="relative">
            <FieldLabel required>Pays</FieldLabel>
            <input value={pays} onChange={(e) => handlePaysChange(e.target.value)} placeholder="Pays" autoComplete="off"
              className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
            {paysSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-navy/15 rounded-lg shadow-sm mt-0.5 max-h-40 overflow-y-auto">
                {paysSuggestions.map((place) => (
                  <button key={place.place_id} onClick={() => selectPaysSuggestion(place)}
                    className="w-full text-left px-3 py-2 text-xs text-navy hover:bg-coral/5 truncate">
                    {place.display_name.split(',')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <FieldLabel>Ville</FieldLabel>
            <input value={ville} onChange={(e) => handleVilleChange(e.target.value)} placeholder="Facultatif" autoComplete="off"
              className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
            {villeSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-navy/15 rounded-lg shadow-sm mt-0.5 max-h-40 overflow-y-auto">
                {villeSuggestions.map((place) => (
                  <button key={place.place_id} onClick={() => selectVilleSuggestion(place)}
                    className="w-full text-left px-3 py-2 text-xs text-navy hover:bg-coral/5 truncate">
                    {place.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description globale de l'itinéraire" rows={2}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-2 focus:outline-none focus:border-coral resize-none" />

        <div className="flex gap-2 mb-2">
          {[
            { key: 'sejour', label: 'Séjour (plusieurs jours)' },
            { key: 'journee', label: "Sortie d'une journée" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFormat(f.key); if (f.key === 'journee') setDays([days[0] || emptyDay(1)]) }}
              className={`flex-1 text-xs font-medium py-2 rounded-full border transition-colors ${
                format === f.key ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:bg-navy/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {format === 'journee' && (
          <div className="mb-4">
            <FieldLabel required>Durée en heures</FieldLabel>
            <input
              type="number" min="1" value={dureeHeures} onChange={(e) => setDureeHeures(e.target.value)}
              placeholder="ex: 3"
              className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
            />
          </div>
        )}
        {format === 'sejour' && <div className="mb-4" />}

        <p className="text-sm font-medium text-navy mb-2">Jours</p>
        <div className="flex flex-col gap-3 mb-3 max-h-96 overflow-y-auto pr-1">
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="border border-navy/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-navy">Jour {day.jour_numero}</span>
                {days.length > 1 && (
                  <button onClick={() => removeDay(dayIdx)} className="text-[11px] text-navy/40 hover:text-red-500">Retirer ce jour</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                <div>
                  <FieldLabel required>Titre du jour</FieldLabel>
                  <input value={day.titre} onChange={(e) => updateDay(dayIdx, 'titre', e.target.value)} placeholder="ex: Baie d'Halong"
                    className="w-full px-2 py-1.5 border border-navy/15 rounded text-xs" />
                </div>
                <div>
                  <FieldLabel>Sous-titre du jour</FieldLabel>
                  <input value={day.sous_titre} onChange={(e) => updateDay(dayIdx, 'sous_titre', e.target.value)} placeholder="Facultatif"
                    className="w-full px-2 py-1.5 border border-navy/15 rounded text-xs" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {day.steps.map((step, stepIdx) => (
                  <div key={stepIdx} className="bg-navy/5 rounded-lg p-2">
                    <div className="flex items-end gap-1.5 mb-1.5">
                      <div className="w-7 h-7 rounded-md border border-dashed border-navy/25 flex items-center justify-center shrink-0 text-navy/40" title="Photo (à venir)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M8 6l1.5-2h5L16 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <FieldLabel required>Nom de l'étape</FieldLabel>
                        <input value={step.nom_etape} onChange={(e) => updateStep(dayIdx, stepIdx, 'nom_etape', e.target.value)} placeholder="Nom de l'étape"
                          className="w-full px-2 py-1.5 border border-navy/15 rounded text-xs" />
                      </div>
                      <div className="w-20">
                        <FieldLabel>Heure</FieldLabel>
                        <select value={step.heure} onChange={(e) => updateStep(dayIdx, stepIdx, 'heure', e.target.value)}
                          className="w-full px-1.5 py-1.5 border border-navy/15 rounded text-xs bg-white">
                          <option value="">--</option>
                          {HEURE_OPTIONS.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                      {day.steps.length > 1 && (
                        <button onClick={() => removeStep(dayIdx, stepIdx)} className="text-navy/40 hover:text-red-500 shrink-0 mb-1.5" aria-label="Retirer l'étape">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <FieldLabel required>Nom du lieu</FieldLabel>
                      <input value={step.lieu} onChange={(e) => handleLieuChange(dayIdx, stepIdx, e.target.value)} placeholder="Nom du lieu"
                        className="w-full px-2 py-1.5 border border-navy/15 rounded text-xs mb-1.5" />
                      {suggestions[`${dayIdx}-${stepIdx}`]?.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 bg-white border border-navy/15 rounded-lg shadow-sm mt-0.5 max-h-32 overflow-y-auto">
                          {suggestions[`${dayIdx}-${stepIdx}`].map((place) => (
                            <button key={place.place_id} onClick={() => selectSuggestion(dayIdx, stepIdx, place)}
                              className="w-full text-left px-2 py-1.5 text-[11px] text-navy hover:bg-coral/5 truncate">
                              {place.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <FieldLabel>Adresse</FieldLabel>
                    <input value={step.adresse} onChange={(e) => updateStep(dayIdx, stepIdx, 'adresse', e.target.value)} placeholder="Pré-remplie automatiquement"
                      className="w-full px-2 py-1.5 border border-navy/15 rounded text-xs text-navy/60" />
                  </div>
                ))}
              </div>
              <button onClick={() => addStep(dayIdx)} className="w-full border border-dashed border-navy/20 rounded-lg py-1.5 text-[11px] text-navy/60 hover:bg-navy/5 transition-colors mt-2">
                + Ajouter une étape à ce jour
              </button>
            </div>
          ))}
        </div>

        {format === 'sejour' && (
          <button onClick={addDay} className="w-full border border-dashed border-navy/20 rounded-lg py-2 text-xs text-navy/60 hover:bg-navy/5 transition-colors mb-4">
            + Ajouter un jour
          </button>
        )}

        {error && <p className="text-[11px] text-red-500 mb-3">{error}</p>}

        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Publication en cours…' : "Publier l'itinéraire"}
        </button>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
