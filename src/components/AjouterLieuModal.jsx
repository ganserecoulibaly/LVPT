import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import PaysAutocomplete from './PaysAutocomplete'

const CATEGORIE_ORDRE = ['Conseil', 'Bon plan', 'Tips', 'Vigilance', 'Arnaque']
const CATEGORIE_STYLE = {
  'Conseil': { bg: '#EAF3DE', text: '#27500A' },
  'Bon plan': { bg: '#EAF3DE', text: '#27500A' },
  'Tips': { bg: '#EAF3DE', text: '#27500A' },
  'Vigilance': { bg: '#EEEDFE', text: '#3C3489' },
  'Arnaque': { bg: '#FCEBEB', text: '#791F1F' },
}

export default function AjouterLieuModal({ userId, onClose, onCreated }) {
  const [nom, setNom] = useState('')
  const [pays, setPays] = useState('')
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [contenu, setContenu] = useState('')
  const [categorie, setCategorie] = useState('Conseil')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!nom.trim() || !pays.trim() || !ville.trim()) {
      setError('Renseigne au moins le nom, le pays et la ville.')
      return
    }
    setSaving(true)
    setError(null)
    const { data: lieu, error: insertError } = await supabase.from('d_lieu').insert({
      nom: nom.trim(),
      pays: pays.trim(),
      ville: ville.trim(),
      quartier: quartier.trim() || null,
      pid: userId,
    }).select().single()

    if (insertError || !lieu) {
      setSaving(false)
      setError("Impossible d'ajouter ce lieu pour le moment.")
      return
    }

    if (contenu.trim()) {
      await supabase.from('s_lieu_commentaire').insert({
        id_lieu: lieu.id_lieu,
        pid: userId,
        contenu: contenu.trim(),
        categorie,
      })
    }

    setSaving(false)
    onCreated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1 text-center">Ajouter un lieu</p>
        <p className="text-sm text-navy/55 mb-5 text-center">Partage un musée ou un site avec la communauté.</p>

        <div className="flex flex-col gap-2.5 mb-4">
          <input type="text" placeholder="Nom du lieu (ex : Le Louvre)" value={nom} onChange={(e) => setNom(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <div className="grid grid-cols-2 gap-2">
            <PaysAutocomplete
              label=""
              placeholder="Pays"
              value={pays}
              onChange={setPays}
            />
            <input type="text" placeholder="Ville" value={ville} onChange={(e) => setVille(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral self-end" />
          </div>
          <input type="text" placeholder="Quartier (facultatif)" value={quartier} onChange={(e) => setQuartier(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
        </div>

        <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Premier commentaire (facultatif)</p>
        <textarea
          placeholder="Un conseil, un bon plan, une mise en garde..."
          value={contenu} onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral resize-none mb-2"
        />
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATEGORIE_ORDRE.map((cat) => {
            const style = CATEGORIE_STYLE[cat]
            return (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: style.bg,
                  color: style.text,
                  outline: categorie === cat ? `2px solid ${style.text}` : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce lieu'}
        </button>
      </div>
    </div>
  )
}
