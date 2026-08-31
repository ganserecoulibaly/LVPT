import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import PaysAutocomplete from './PaysAutocomplete'

const PLATEFORMES = [
  { key: 'lien_spotify', label: 'Spotify' },
  { key: 'lien_youtube', label: 'YouTube' },
  { key: 'lien_apple_music', label: 'Apple Music' },
  { key: 'lien_deezer', label: 'Deezer' },
]

export default function AjouterMusiqueModal({ userId, onClose, onCreated }) {
  const [titre, setTitre] = useState('')
  const [artiste, setArtiste] = useState('')
  const [pays, setPays] = useState('')
  const [liens, setLiens] = useState({ lien_spotify: '', lien_youtube: '', lien_apple_music: '', lien_deezer: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!titre.trim() || !artiste.trim()) {
      setError('Renseigne au moins un titre et un artiste.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('s_musique').insert({
      pid: userId,
      titre: titre.trim(),
      artiste: artiste.trim(),
      pays: pays.trim() || null,
      lien_spotify: liens.lien_spotify.trim() || null,
      lien_youtube: liens.lien_youtube.trim() || null,
      lien_apple_music: liens.lien_apple_music.trim() || null,
      lien_deezer: liens.lien_deezer.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError("Impossible d'ajouter ce morceau pour le moment.")
      return
    }
    onCreated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8">
      <div onClick={(e) => e.stopPropagation()} style={{ height: 'fit-content' }} className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <p className="font-serif text-lg text-navy mb-1">Ajouter une musique</p>
        <p className="text-sm text-navy/55 mb-5">Fais découvrir un morceau aux autres voyageurs.</p>

        <div className="flex flex-col gap-2.5 mb-4">
          <input type="text" placeholder="Titre du morceau" value={titre} onChange={(e) => setTitre(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <input type="text" placeholder="Artiste" value={artiste} onChange={(e) => setArtiste(e.target.value)} className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
          <PaysAutocomplete
            label=""
            placeholder="Pays (facultatif)"
            value={pays}
            onChange={setPays}
          />
        </div>

        <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Liens (facultatifs)</p>
        <div className="flex flex-col gap-2.5 mb-5">
          {PLATEFORMES.map((p) => (
            <input
              key={p.key}
              type="url"
              placeholder={`Lien ${p.label}`}
              value={liens[p.key]}
              onChange={(e) => setLiens((prev) => ({ ...prev, [p.key]: e.target.value }))}
              className="px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
          {saving ? 'Ajout…' : 'Ajouter ce morceau'}
        </button>
      </div>
    </div>
  )
}
