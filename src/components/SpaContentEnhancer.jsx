import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import PaysAutocomplete from './PaysAutocomplete'

const FIELDS = ['nom', 'type_spa', 'pays', 'ville', 'quartier', 'description', 'prix_indicatif', 'lien_resa']
const LABELS = {
  nom: 'Nom', type_spa: 'Type de spa', pays: 'Pays', ville: 'Ville', quartier: 'Quartier',
  description: 'Description', prix_indicatif: 'Prix indicatif', lien_resa: 'Lien de réservation',
}
const TYPES = [
  ['spa_hotel', "Spa d'hôtel"], ['thermes', 'Thermes'], ['bain_thermal', 'Bain thermal'],
  ['source_chaude', "Source naturelle d'eau chaude"], ['hammam_hotel', "Hammam d'hôtel"],
  ['onsen', 'Onsen'], ['spa_nordique', 'Spa nordique'], ['flottaison_cryo', 'Flottaison / Cryothérapie'],
]

function canEdit(record, userId, isAdmin) { return Boolean(isAdmin || record?.pid === userId) }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1-1-4Z"/></svg> }

function FormFields({ draft, setDraft }) {
  return <div className="flex flex-col gap-3">
    {FIELDS.map((field) => (
      <label key={field} className="text-xs text-navy/65">
        {LABELS[field]}
        {field === 'pays' ? <div className="mt-1"><PaysAutocomplete label="" placeholder="Pays" value={draft[field] ?? ''} onChange={(value) => setDraft((d) => ({ ...d, [field]: value }))} /></div>
          : field === 'type_spa' ? <select value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm bg-white"><option value="">Type (facultatif)</option>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          : field === 'description' ? <textarea value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} rows={4} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm resize-none" />
          : <input type={field === 'lien_resa' ? 'url' : 'text'} inputMode={field === 'prix_indicatif' ? 'decimal' : undefined} value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm" />}
      </label>
    ))}
  </div>
}

function SpaModal({ mode, record, userId, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, record?.[f] ?? ''])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    if (!draft.nom?.trim() || !draft.pays?.trim() || !draft.ville?.trim()) {
      setError('Renseigne au moins le nom, le pays et la ville.')
      return
    }
    setSaving(true); setError(null)
    const payload = { ...draft }
    FIELDS.forEach((f) => { if (payload[f] === '') payload[f] = null })
    if (payload.prix_indicatif != null) {
      const rawPrice = String(payload.prix_indicatif).trim().replace(',', '.')
      const price = Number(rawPrice)
      if (!Number.isFinite(price)) {
        setError('Le prix indicatif doit être un nombre valide.')
        setSaving(false)
        return
      }
      payload.prix_indicatif = price
    }
    if (mode === 'create') {
      payload.pid = userId
      payload.actif = true
      const { data, error: insertError } = await supabase.from('s_spa').insert(payload).select('id_spa').single()
      if (insertError) { setError(insertError.message); setSaving(false); return }
      if (!data) { setError('Le spa n’a pas été enregistré.'); setSaving(false); return }
    } else {
      const { data, error: updateError } = await supabase.from('s_spa').update(payload).eq('id_spa', record.id_spa).select('id_spa').single()
      if (updateError) { setError(updateError.message); setSaving(false); return }
      if (!data) { setError('La modification du spa n’a pas été enregistrée.'); setSaving(false); return }
    }
    setSaving(false); onSaved()
  }

  return createPortal(<div className="fixed inset-0 z-[1200] bg-navy/45 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5"><div><p className="text-xs uppercase tracking-wide text-coral">{mode === 'create' ? 'Ajouter' : 'Modifier'}</p><h2 className="font-serif text-xl text-navy">{mode === 'create' ? 'Un spa' : 'Spa & bien-être'}</h2></div><button type="button" onClick={onClose} disabled={saving} className="text-navy/40 hover:text-navy" aria-label="Fermer">✕</button></div>
      <FormFields draft={draft} setDraft={setDraft} />
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      <button type="button" onClick={save} disabled={saving} className="btn-primary w-full justify-center mt-5 disabled:opacity-60">{saving ? 'Enregistrement…' : mode === 'create' ? 'Ajouter ce spa' : 'Enregistrer'}</button>
    </div>
  </div>, document.body)
}

function EditButton({ onClick }) { return <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} className="w-7 h-7 rounded-full border border-navy/15 text-navy/60 hover:bg-navy/5 hover:text-coral flex items-center justify-center transition-colors shrink-0" aria-label="Modifier" title="Modifier"><EditIcon /></button> }

export default function SpaContentEnhancer({ children }) {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [records, setRecords] = useState([])
  const [target, setTarget] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [mounted, setMounted] = useState([])

  const load = async () => {
    if (!user) return
    const { data } = await supabase.from('s_spa').select('*').eq('actif', true).order('created_at', { ascending: false })
    setRecords(data || [])
  }

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null)) }, [])
  useEffect(() => { if (!user) return; supabase.from('lvpt').select('is_admin').eq('id', user.id).single().then(({ data }) => setIsAdmin(Boolean(data?.is_admin))) }, [user])
  useEffect(() => { load() }, [user])

  useEffect(() => {
    if (!user || location.pathname !== '/spa-bien-etre') return undefined
    const state = location.state
    if (state?.openAddSpa) {
      setAddOpen(true)
      window.history.replaceState({}, document.title, window.location.href.split('#')[0])
    }
  }, [user, location])

  useEffect(() => {
    if (!user) return undefined
    const mount = () => {
      const next = []
      const heading = Array.from(document.querySelectorAll('h1')).find((el) => el.textContent?.trim() === 'Spa & bien-être')
      if (heading) heading.dataset.lvptSpaAddHandled = 'true'

      records.forEach((record) => {
        if (!canEdit(record, user.id, isAdmin)) return
        const title = String(record.nom || '').trim().toLowerCase()
        if (!title) return
        const titleNode = Array.from(document.querySelectorAll('p,h2,h3,h4')).find((el) => el.textContent?.trim().toLowerCase() === title)
        if (!titleNode) return
        let card = titleNode
        for (let i = 0; i < 8 && card; i += 1) {
          if (card.querySelector?.('button[aria-label="Favori"]')) break
          card = card.parentElement
        }
        const heart = card?.querySelector?.('button[aria-label="Favori"]')
        const anchor = heart || titleNode
        if (!anchor || anchor.dataset.lvptSpaEdit) return
        const host = document.createElement('span')
        host.className = heart ? 'absolute top-2 right-10 z-10' : 'inline-flex ml-1'
        anchor.parentNode.insertBefore(host, anchor.nextSibling)
        anchor.dataset.lvptSpaEdit = record.id_spa
        next.push({ key: `spa-edit-${record.id_spa}`, host, record })
      })
      if (next.length) setMounted((current) => { const keys = new Set(current.map((x) => x.key)); return [...current, ...next.filter((x) => !keys.has(x.key))] })
    }
    mount()
    const observer = new MutationObserver(mount); observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [user, isAdmin, records, location.pathname])

  const saved = async () => { setAddOpen(false); setTarget(null); setMounted([]); window.location.reload() }
  return <>
    {children}
    {mounted.map((item) => createPortal(<EditButton onClick={() => setTarget(item.record)} />, item.host, item.key))}
    {addOpen && <SpaModal mode="create" userId={user?.id} onClose={() => setAddOpen(false)} onSaved={saved} />}
    {target && <SpaModal mode="edit" record={target} userId={user?.id} onClose={() => setTarget(null)} onSaved={saved} />}
  </>
}
