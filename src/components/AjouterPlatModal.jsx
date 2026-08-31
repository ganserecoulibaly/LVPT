import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import PaysAutocomplete from './PaysAutocomplete'

export default function AjouterPlatModal({ userId, onClose, onCreated }) {
  const [nomPlat, setNomPlat] = useState('')
  const [nomRestaurant, setNomRestaurant] = useState('')
  const [adresseRestaurant, setAdresseRestaurant] = useState('')
  const [ville, setVille] = useState('')
  const [pays, setPays] = useState('')
  const [prix, setPrix] = useState('')
  const [lienPhoto, setLienPhoto] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!nomPlat.trim() || !nomRestaurant.trim() || !ville.trim() || !pays.trim() || !prix.trim()) {
      setError('Nom du plat, resto, ville, pays et prix sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    const { data: plat, error: insertError } = await supabase.from('d_plat').insert({
      nom_plat: nomPlat.trim(),
      nom_restaurant: nomRestaurant.trim(),
      adresse_restaurant: adresseRestaurant.trim() || null,
      ville: ville.trim(),
      pays: pays.trim(),
      prix: prix.trim(),
      lien_photo: lienPhoto.trim() || null,
      notes: notes.trim() || null,
      pid: userId,
    }).select().single()

    setSaving(false)
    if (insertError || !plat) {
      setError("Impossible d'ajouter ce plat pour le moment.")
      return
    }
    onCreated(plat.id_plat)
  }

  const inputClass = "w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
  const labelClass = "text-xs text-navy/60 mb-1 block"

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1 text-center">Ajouter un plat</p>
        <p className="text-sm text-navy/55 mb-5 text-center">Partage un plat que tu as goûté avec la communauté.</p>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className={labelClass}>Nom du plat <span className="text-red-500">*</span></label>
            <input type="text" placeholder="ex : Pho de Hanoï" value={nomPlat} onChange={(e) => setNomPlat(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nom du restaurant <span className="text-red-500">*</span></label>
            <input type="text" placeholder="ex : Maman Trang" value={nomRestaurant} onChange={(e) => setNomRestaurant(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Adresse du restaurant</label>
            <input type="text" placeholder="Facultatif" value={adresseRestaurant} onChange={(e) => setAdresseRestaurant(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Ville <span className="text-red-500">*</span></label>
              <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} className={inputClass} />
            </div>
            <PaysAutocomplete
              label="Pays"
              placeholder="France"
              value={pays}
              onChange={setPays}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Prix <span className="text-red-500">*</span></label>
            <input type="text" placeholder="ex : 70 000 VND" value={prix} onChange={(e) => setPrix(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lien de la photo</label>
            <input type="url" placeholder="Facultatif" value={lienPhoto} onChange={(e) => setLienPhoto(e.target.value)} className={inputClass} />
          </div>
        </div>

        <label className="text-xs text-navy/40 uppercase tracking-wide mb-2 block">Notes (facultatif)</label>
        <textarea
          placeholder="Une info en plus sur ce plat, l'ambiance, où le trouver..."
          value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral resize-none mb-5"
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce plat'}
        </button>
      </div>
    </div>
  )
}
