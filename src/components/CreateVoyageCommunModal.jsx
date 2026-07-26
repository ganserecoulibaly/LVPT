import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient'

const COLOR_MAP = {
  green: { bg: '#EAF3DE', text: '#27500A', border: '#639922' },
  amber: { bg: '#FAEEDA', text: '#633806', border: '#BA7517' },
  blue: { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  pink: { bg: '#FBEAF0', text: '#72243E', border: '#D4537E' },
  teal: { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' },
  red: { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' },
}
const DEFAULT_COLOR = { bg: '#F1EFE8', text: '#444441', border: '#B4B2A9' }

function getColor(nom) {
  return COLOR_MAP[nom] || DEFAULT_COLOR
}

// Autocomplétion de pays via Nominatim (OpenStreetMap), gratuite sans clé —
// même approche que CreateItineraireModal.jsx.
async function searchCountry(query) {
  if (!query || query.trim().length < 2) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featureType=country&accept-language=fr&limit=5`
  )
  if (!res.ok) return []
  return res.json()
}

// Autocomplétion de ville, filtrée par pays si déjà renseigné.
async function searchCity(query, paysContext) {
  if (!query || query.trim().length < 2) return []
  const q = paysContext ? `${query}, ${paysContext}` : query
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&featureType=city&accept-language=fr&limit=5`
  )
  if (!res.ok) return []
  return res.json()
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] font-medium text-navy/70 mb-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

export default function CreateVoyageCommunModal({ userId, onClose, onCreated, editingPost = null }) {
  const isEditing = Boolean(editingPost)
  const [categories, setCategories] = useState([])
  const [selectedCategorieId, setSelectedCategorieId] = useState(editingPost?.id_categorie || '')
  const [titre, setTitre] = useState(editingPost?.titre || '')
  const [pays, setPays] = useState(editingPost?.pays || '')
  const [ville, setVille] = useState(editingPost?.ville || '')
  const [paysSuggestions, setPaysSuggestions] = useState([])
  const [villeSuggestions, setVilleSuggestions] = useState([])
  const [description, setDescription] = useState(editingPost?.description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Un timer par champ ('pays' / 'ville') — même délai que dans
  // CreateItineraireModal.jsx, même raison : Nominatim tolère 1 requête/
  // seconde max, sans debounce chaque frappe déclenchait sa propre requête.
  const debounceTimers = useRef({})
  const DEBOUNCE_MS = 400
  const debounced = (key, fn) => {
    clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(fn, DEBOUNCE_MS)
  }

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('voyage_commun_categorie').select('*').order('ordre', { ascending: true })
      setCategories(data || [])
    }
    loadCategories()
  }, [])

  const handlePaysChange = (value) => {
    setPays(value)
    debounced('pays', async () => {
      setPaysSuggestions(await searchCountry(value))
    })
  }
  const selectPaysSuggestion = (place) => {
    setPays(place.display_name.split(',')[0])
    setPaysSuggestions([])
  }

  const handleVilleChange = (value) => {
    setVille(value)
    debounced('ville', async () => {
      setVilleSuggestions(await searchCity(value, pays))
    })
  }
  const selectVilleSuggestion = (place) => {
    setVille(place.display_name.split(',')[0])
    setVilleSuggestions([])
  }

  const handleSubmit = async () => {
    if (!selectedCategorieId) {
      setError('Choisis un type de post.')
      return
    }
    if (!titre.trim() || !pays.trim() || !description.trim()) {
      setError('Le titre, le pays et la description sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      id_categorie: selectedCategorieId,
      titre: titre.trim(),
      pays: pays.trim(),
      ville: ville.trim() || null,
      description: description.trim(),
    }

    const { error: submitError } = isEditing
      ? await supabase.from('s_voyage_commun').update({ ...payload, updated_at: new Date().toISOString() }).eq('id_post', editingPost.id_post)
      : await supabase.from('s_voyage_commun').insert({ ...payload, pid: userId })

    if (submitError) {
      setError(submitError.message || 'Une erreur est survenue, réessaie.')
      setSaving(false)
      return
    }

    onCreated?.()
  }

  const modalContent = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="font-serif text-lg text-navy mb-4">{isEditing ? 'Modifier le post' : 'Partager un post'}</p>

        <FieldLabel required>Type</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-4">
          {categories.map((c) => {
            const color = getColor(c.couleur)
            const selected = selectedCategorieId === c.id_categorie
            return (
              <button
                key={c.id_categorie}
                onClick={() => setSelectedCategorieId(c.id_categorie)}
                className="rounded-lg py-2 text-xs text-center transition-colors"
                style={{
                  backgroundColor: selected ? color.bg : 'transparent',
                  border: `1px solid ${selected ? color.border : '#D3D1C7'}`,
                  color: selected ? color.text : '#5F5E5A',
                }}
              >
                {c.nom}
              </button>
            )
          })}
        </div>

        <FieldLabel required>Titre</FieldLabel>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex: Vol Paris-Lisbonne à 42 euros"
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-3 focus:outline-none focus:border-coral" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
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

        <FieldLabel required>Description</FieldLabel>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Décris ton conseil, bon plan ou l'arnaque à éviter"
          rows={4}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm mb-4 focus:outline-none focus:border-coral resize-none"
        />

        {error && <p className="text-[11px] text-red-500 mb-3">{error}</p>}

        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Enregistrement en cours…' : (isEditing ? 'Enregistrer' : 'Publier')}
        </button>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
