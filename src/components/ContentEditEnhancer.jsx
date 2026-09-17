import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'

const CONFIG = {
  '/activites': { table: 'd_lieu', id: 'id_lieu', title: 'nom', fields: ['nom', 'pays', 'ville', 'quartier', 'description', 'adresse', 'lien_photo'], label: 'Lieu / visite / musée' },
  '/carnet-gastronomique': { table: 'd_plat', id: 'id_plat', title: 'nom_plat', fields: ['nom_plat', 'nom_restaurant', 'adresse_restaurant', 'ville', 'pays', 'prix', 'lien_photo', 'notes'], label: 'Gastronomie' },
  '/voyage-commun': { table: 's_voyage_commun', id: 'id_post', title: 'titre', fields: ['titre', 'pays', 'ville', 'description'], label: 'Le Comptoir Voyage' },
  '/playlist': { table: 's_musique', id: 'id_musique', title: 'titre', fields: ['titre', 'artiste', 'pays', 'lien_spotify', 'lien_youtube', 'lien_apple_music', 'lien_deezer'], label: 'Playlist du voyage' },
  '/depenses': { table: 's_depense', id: 'id_depense', title: 'intitule', fields: ['intitule', 'montant', 'devise', 'categorie', 'date_depense'], label: 'Dépense' },
}

const LABELS = {
  nom: 'Nom', pays: 'Pays', ville: 'Ville', quartier: 'Quartier', description: 'Description', adresse: 'Adresse', lien_photo: 'Photo',
  nom_plat: 'Nom du plat', nom_restaurant: 'Restaurant', adresse_restaurant: 'Adresse du restaurant', prix: 'Prix', notes: 'Notes',
  titre: 'Titre', artiste: 'Artiste', lien_spotify: 'Spotify', lien_youtube: 'YouTube', lien_apple_music: 'Apple Music', lien_deezer: 'Deezer',
  intitule: 'Intitulé', montant: 'Montant', devise: 'Devise', categorie: 'Catégorie', date_depense: 'Date',
}

function canEdit(record, userId, isAdmin) { return Boolean(isAdmin || record?.pid === userId) }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1-1-4Z"/></svg> }
function EditButton({ onClick }) { return <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} className="w-7 h-7 rounded-full border border-navy/15 text-navy/60 hover:bg-navy/5 hover:text-coral flex items-center justify-center transition-colors shrink-0" aria-label="Modifier" title="Modifier"><EditIcon /></button> }

function EditModal({ target, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(target.config.fields.map((f) => [f, target.record[f] ?? ''])))
  const [saving, setSaving] = useState(false); const [error, setError] = useState(null)
  const save = async () => {
    setSaving(true); setError(null); const payload = { ...draft }
    Object.keys(payload).forEach((key) => { if (payload[key] === '') payload[key] = null })
    if (target.table === 's_depense' && payload.montant != null) {
      const oldAmount = Number(target.record.montant); const oldEur = Number(target.record.montant_eur); const newAmount = Number(payload.montant)
      if (payload.devise === 'EUR') payload.montant_eur = newAmount
      else if (Number.isFinite(oldAmount) && oldAmount !== 0 && Number.isFinite(oldEur)) payload.montant_eur = Number((newAmount * oldEur / oldAmount).toFixed(2))
    }
    if ('updated_at' in target.record) payload.updated_at = new Date().toISOString()
    const { error: updateError } = await supabase.from(target.table).update(payload).eq(target.config.id, target.record[target.config.id])
    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSaving(false); onSaved()
  }
  return createPortal(<div className="fixed inset-0 z-[1200] bg-navy/45 flex items-center justify-center p-4" onClick={() => !saving && onClose()}><div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><div><p className="text-xs uppercase tracking-wide text-coral">Modifier</p><h2 className="font-serif text-xl text-navy">{target.config.label}</h2></div><button type="button" onClick={onClose} disabled={saving} className="text-navy/40 hover:text-navy" aria-label="Fermer">✕</button></div><div className="flex flex-col gap-3">{target.config.fields.map((field) => <label key={field} className="text-xs text-navy/65">{LABELS[field] || field}{field === 'description' || field === 'notes' ? <textarea value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} rows={4} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy"/> : <input type={field === 'date_depense' ? 'date' : field === 'montant' ? 'number' : 'text'} value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy"/>}</label>)}</div>{error && <p className="text-xs text-red-500 mt-3">{error}</p>}<button type="button" onClick={save} disabled={saving} className="btn-primary w-full justify-center mt-5 disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div></div>, document.body)
}

function normalize(s) { return String(s ?? '').trim().toLowerCase() }
function findTitleNode(title) { return Array.from(document.querySelectorAll('p,h2,h3,h4')).find((el) => normalize(el.textContent) === title) }
function findCard(titleNode) {
  if (!titleNode) return null
  let current = titleNode
  for (let i = 0; i < 8 && current; i += 1) {
    if (current.querySelector?.('button[aria-label="Favori"]')) return current
    current = current.parentElement
  }
  return titleNode.parentElement
}
function findAmountAnchor(card, record) {
  if (!card) return null
  const amount = normalize(record.montant); if (!amount) return null
  const candidates = Array.from(card.querySelectorAll('*')).filter((el) => normalize(el.textContent) === amount)
  return candidates.sort((a, b) => a.textContent.length - b.textContent.length)[0] || null
}

export default function ContentEditEnhancer({ children }) {
  const location = useLocation(); const config = useMemo(() => CONFIG[location.pathname], [location.pathname])
  const [user, setUser] = useState(null); const [isAdmin, setIsAdmin] = useState(false); const [records, setRecords] = useState([]); const [target, setTarget] = useState(null); const [mounted, setMounted] = useState([])
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null)) }, [])
  useEffect(() => { if (!user) return; supabase.from('lvpt').select('is_admin').eq('id', user.id).single().then(({ data }) => setIsAdmin(Boolean(data?.is_admin))) }, [user])
  useEffect(() => { if (!config || !user) { setRecords([]); return }; supabase.from(config.table).select('*').order('created_at', { ascending: false }).then(({ data }) => setRecords(data || [])) }, [config, user])

  useEffect(() => {
    if (!config || !user || records.length === 0) { setMounted([]); return undefined }
    const mount = () => {
      const next = []
      records.forEach((record) => {
        if (!canEdit(record, user.id, isAdmin)) return
        const title = normalize(record[config.title]); if (!title) return
        const titleNode = findTitleNode(title); const card = findCard(titleNode); if (!card) return
        const heart = card.querySelector('button[aria-label="Favori"]')
        let anchor
        if (heart) anchor = heart
        else if (config.table === 's_depense') anchor = findAmountAnchor(card, record) || titleNode
        else anchor = titleNode
        if (!anchor || anchor.dataset.lvptContentEdit) return
        const host = document.createElement('span')
        host.className = heart ? 'absolute top-2 right-10 z-10' : 'inline-flex items-center ml-1'
        anchor.parentNode.insertBefore(host, anchor.nextSibling)
        anchor.dataset.lvptContentEdit = record[config.id]
        next.push({ key: `${config.table}-${record[config.id]}`, host, record, config, table: config.table })
      })
      if (next.length) setMounted((current) => { const existing = new Set(current.map((x) => x.key)); return [...current, ...next.filter((x) => !existing.has(x.key))] })
    }
    mount(); const observer = new MutationObserver(mount); observer.observe(document.body, { childList: true, subtree: true }); return () => observer.disconnect()
  }, [config, user, isAdmin, records])

  const saved = async () => { setTarget(null); setMounted([]); await new Promise((r) => setTimeout(r, 50)); window.location.reload() }
  return <>{children}{mounted.map((item) => createPortal(<EditButton onClick={() => setTarget(item)} />, item.host, item.key))}{target && <EditModal target={target} onClose={() => setTarget(null)} onSaved={saved} />}</>
}
