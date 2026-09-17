import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import PaysAutocomplete from './PaysAutocomplete'

const TYPES = [
  ['spa_hotel', "Spa d'hôtel"],
  ['thermes', 'Thermes'],
  ['bain_thermal', 'Bain thermal'],
  ['source_chaude', "Source naturelle d'eau chaude"],
  ['hammam_hotel', "Hammam d'hôtel"],
  ['onsen', 'Onsen'],
  ['spa_nordique', 'Spa nordique'],
  ['flottaison_cryo', 'Flottaison / Cryothérapie'],
]

const inputClass = 'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral'

export default function AjouterSpaModal({ userId, onClose, onCreated }) {
  const [nom, setNom] = useState('')
  const [typeSpa, setTypeSpa] = useState('')
  const [pays, setPays] = useState('')
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [description, setDescription] = useState('')
  const [prixIndicatif, setPrixIndicatif] = useState('')
  const [lienResa, setLienResa] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!nom.trim() || !pays.trim() || !ville.trim()) {
      setError('Renseigne au moins le nom, le pays et la ville.')
      return
    }
    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase.from('s_spa').insert({
      nom: nom.trim(),
      type_spa: typeSpa || null,
      pays: pays.trim(),
      ville: ville.trim(),
      quartier: quartier.trim() || null,
      description: description.trim() || null,
      prix_indicatif: prixIndicatif.trim() || null,
      lien_resa: lienResa.trim() || null,
      pid: userId,
      actif: true,
    }).select().single()

    setSaving(false)
    if (insertError || !data) {
      setError(insertError?.message || "Impossible d'ajouter ce spa pour le moment.")
      return
    }
    onCreated(data)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy" aria-label="Fermer">✕</button>
        <p className="font-serif text-lg text-navy mb-1 text-center">Ajouter un spa</p>
        <p className="text-sm text-navy/55 mb-5 text-center">Partage une adresse bien-être avec la communauté.</p>

        <div className="flex flex-col gap-2.5">
          <input type="text" placeholder="Nom du spa" value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
          <select value={typeSpa} onChange={(e) => setTypeSpa(e.target.value)} className={`${inputClass} bg-white`}>
            <option value="">Type de spa (facultatif)</option>
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <PaysAutocomplete label="" placeholder="Pays" value={pays} onChange={setPays} />
            <input type="text" placeholder="Ville" value={ville} onChange={(e) => setVille(e.target.value)} className={`${inputClass} self-end`} />
          </div>
          <input type="text" placeholder="Quartier (facultatif)" value={quartier} onChange={(e) => setQuartier(e.target.value)} className={inputClass} />
          <textarea placeholder="Description (facultatif)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          <input type="text" placeholder="Prix indicatif (ex : 45 €)" value={prixIndicatif} onChange={(e) => setPrixIndicatif(e.target.value)} className={inputClass} />
          <input type="url" placeholder="Lien de réservation (facultatif)" value={lienResa} onChange={(e) => setLienResa(e.target.value)} className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 mt-5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce spa'}
        </button>
      </div>
    </div>
  )
}
