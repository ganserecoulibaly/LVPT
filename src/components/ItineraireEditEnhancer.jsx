import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

const FIELD_LABELS = {
  titre: 'Titre', pays: 'Pays', ville: 'Ville', description: 'Description',
  duree_totale_jour: 'Durée totale (jours)', duree_totale_heure: 'Durée totale (heures)', url_cover: 'Image de couverture',
  jour_numero: 'Numéro du jour', sous_titre: 'Sous-titre', nom_etape: 'Nom de l’étape',
  adresse: 'Adresse', lieu: 'Lieu', heure: 'Heure', duree: 'Durée',
}

const FIELDS = {
  itineraire: ['titre', 'pays', 'ville', 'description', 'duree_totale_jour', 'duree_totale_heure', 'url_cover'],
  jour: ['jour_numero', 'titre', 'sous_titre'],
  step: ['nom_etape', 'adresse', 'lieu', 'heure', 'duree', 'description', 'url_cover'],
}

function canEdit(record, userId, isAdmin) {
  return Boolean(isAdmin || record?.pid === userId)
}

function EditButton({ onClick, label = 'Modifier' }) {
  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick() }}
      className="w-7 h-7 rounded-full border border-navy/15 text-navy/60 hover:bg-navy/5 hover:text-coral flex items-center justify-center transition-colors ml-1 shrink-0"
      aria-label={label}
      title={label}
    >
      <EditIcon />
    </button>
  )
}

function EditModal({ target, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries((FIELDS[target.type] || []).map((field) => [field, target.record[field] ?? ''])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    const payload = { ...draft }
    Object.keys(payload).forEach((key) => { if (payload[key] === '') payload[key] = null })
    if ('updated_at' in target.record) payload.updated_at = new Date().toISOString()

    const idField = target.type === 'itineraire' ? 'id_itineraire' : target.type === 'jour' ? 'id_jour' : 'id_segment'
    const { error: updateError } = await supabase.from(target.table).update(payload).eq(idField, target.record[idField])

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[1200] bg-navy/45 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-coral">Modifier</p>
            <h2 className="font-serif text-xl text-navy">{target.type === 'itineraire' ? 'Itinéraire' : target.type === 'jour' ? 'Jour' : 'Étape'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-navy/40 hover:text-navy">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          {(FIELDS[target.type] || []).map((field) => (
            <label key={field} className="text-xs text-navy/65">
              {FIELD_LABELS[field] || field}
              {field === 'description' || field === 'sous_titre' ? (
                <textarea value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} rows={4} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy" />
              ) : (
                <input value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy" />
              )}
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <button type="button" onClick={save} disabled={saving} className="btn-primary w-full justify-center mt-5 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function ItineraireEditEnhancer({ children }) {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [itineraire, setItineraire] = useState(null)
  const [days, setDays] = useState([])
  const [target, setTarget] = useState(null)
  const [portalTargets, setPortalTargets] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single().then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  const reload = async () => {
    if (!id || !user) return
    const [{ data: it }, { data: jours }] = await Promise.all([
      supabase.from('s_itineraire').select('*').eq('id_itineraire', id).single(),
      supabase.from('s_itineraire_jour').select('*').eq('id_itineraire', id).order('jour_numero', { ascending: true }),
    ])
    if (!it) return
    const jourIds = (jours || []).map((j) => j.id_jour)
    const { data: steps } = jourIds.length
      ? await supabase.from('s_itineraire_step').select('*').in('id_jour', jourIds).order('no_ordre', { ascending: true })
      : { data: [] }
    const stepsByJour = {}
    ;(steps || []).forEach((step) => {
      if (!stepsByJour[step.id_jour]) stepsByJour[step.id_jour] = []
      stepsByJour[step.id_jour].push(step)
    })
    setItineraire(it)
    setDays((jours || []).map((day) => ({ ...day, steps: stepsByJour[day.id_jour] || [] })))
  }

  useEffect(() => { reload() }, [id, user])

  const canManage = useMemo(() => Boolean(itineraire && user && canEdit(itineraire, user.id, isAdmin)), [itineraire, user, isAdmin])

  useEffect(() => {
    if (!canManage) {
      setPortalTargets([])
      return undefined
    }

    const mountButtons = () => {
      const found = []
      const deleteButton = document.querySelector('button[aria-label="Supprimer cet itinéraire"]')
      if (deleteButton && !deleteButton.dataset.lvptEditMounted) {
        const host = document.createElement('span')
        deleteButton.parentNode.insertBefore(host, deleteButton)
        deleteButton.dataset.lvptEditMounted = 'true'
        found.push({ key: 'itineraire', type: 'itineraire', table: 's_itineraire', record: itineraire, host })
      }

      const dayButtons = Array.from(document.querySelectorAll('button')).filter((button) => {
        const text = button.textContent?.trim() || ''
        return /^Jour\s+\d+/.test(text) && button.classList.contains('rounded-lg')
      })
      dayButtons.forEach((button) => {
        const match = button.textContent.trim().match(/^Jour\s+(\d+)/)
        const day = days.find((item) => String(item.jour_numero) === match?.[1])
        if (!day || button.dataset.lvptEditMounted) return
        const host = document.createElement('span')
        host.className = 'inline-flex'
        button.appendChild(host)
        button.dataset.lvptEditMounted = 'true'
        found.push({ key: `jour-${day.id_jour}`, type: 'jour', table: 's_itineraire_jour', record: day, host })
      })

      const activeDayButton = dayButtons.find((button) => button.classList.contains('bg-coral'))
      const activeMatch = activeDayButton?.textContent?.trim().match(/^Jour\s+(\d+)/)
      const currentDay = days.find((day) => String(day.jour_numero) === activeMatch?.[1]) || days[0]
      const stepCards = Array.from(document.querySelectorAll('div')).filter((el) =>
        el.classList.contains('flex') && el.classList.contains('items-center') && el.classList.contains('gap-3') &&
        el.classList.contains('bg-navy/5') && el.classList.contains('rounded-lg') && el.classList.contains('p-2.5')
      )
      ;(currentDay?.steps || []).forEach((step, index) => {
        const card = stepCards[index]
        if (!card || card.dataset.lvptEditMounted) return
        const host = document.createElement('span')
        host.className = 'inline-flex'
        card.appendChild(host)
        card.dataset.lvptEditMounted = 'true'
        found.push({ key: `step-${step.id_segment}`, type: 'step', table: 's_itineraire_step', record: step, host })
      })

      if (found.length) setPortalTargets((current) => {
        const next = [...current]
        found.forEach((item) => { if (!next.some((existing) => existing.key === item.key)) next.push(item) })
        return next
      })
    }

    mountButtons()
    const observer = new MutationObserver(mountButtons)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [canManage, itineraire, days])

  const closeAndReload = async () => {
    setTarget(null)
    setPortalTargets([])
    await reload()
    window.location.reload()
  }

  return (
    <>
      {children}
      {portalTargets.map((item) => createPortal(<EditButton onClick={() => setTarget(item)} />, item.host, item.key))}
      {target && <EditModal target={target} onClose={() => setTarget(null)} onSaved={closeAndReload} />}
    </>
  )
}
