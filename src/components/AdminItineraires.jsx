import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AdminRoute from './AdminRoute'

async function searchPlace(query) {
  if (!query || query.trim().length < 3) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
  )
  if (!res.ok) return []
  return res.json()
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function Modal({ title, children, onClose, onSave, saving, error }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-navy/45 px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative my-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy" aria-label="Fermer">×</button>
        <h2 className="font-serif text-xl text-navy pr-10 mb-5">{title}</h2>
        {children}
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-navy/15 text-sm text-navy/70 hover:bg-navy/5 disabled:opacity-50">Annuler</button>
          <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-coral text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            <SaveIcon /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, textarea = false }) {
  const common = {
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    placeholder,
    className: 'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral',
  }
  return (
    <div>
      <label className="block text-[11px] font-medium text-navy/70 mb-1">{label}</label>
      {textarea ? <textarea {...common} rows={3} className={`${common.className} resize-none`} /> : <input {...common} type={type} />}
    </div>
  )
}

function PlaceField({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!value || value.trim().length < 3) { setSuggestions([]); return }
      setLoading(true)
      try { setSuggestions(await searchPlace(value)) } catch { setSuggestions([]) } finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative">
      <label className="block text-[11px] font-medium text-navy/70 mb-1">Nom du lieu</label>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} autoComplete="off" placeholder="Lieu ou quartier" className="w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral" />
      {(loading || suggestions.length > 0) && (
        <div className="absolute z-20 left-0 right-0 bg-white border border-navy/15 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-xs text-navy/40">Recherche…</p>}
          {suggestions.map((place) => (
            <button key={place.place_id} onClick={() => { onSelect(place); setSuggestions([]) }} className="w-full text-left px-3 py-2 text-xs text-navy hover:bg-coral/5">
              {place.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ItineraireCard({ item, onEdit }) {
  return (
    <div className="bg-white rounded-xl border border-navy/10 overflow-hidden">
      {item.url_cover ? <img src={item.url_cover} alt="" className="w-full h-32 object-cover" /> : <div className="h-32 bg-navy/5" />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-lg text-navy truncate">{item.titre}</p>
            <p className="text-xs text-navy/50 mt-1">{item.pays}{item.ville ? ` — ${item.ville}` : ''}</p>
            <p className="text-xs text-navy/40 mt-1">{item.duree_totale_jour ? `${item.duree_totale_jour} jour${item.duree_totale_jour > 1 ? 's' : ''}` : 'Itinéraire'}</p>
          </div>
          <button onClick={() => onEdit(item)} className="shrink-0 rounded-lg border border-navy/15 px-3 py-2 text-xs text-navy hover:bg-navy/5 flex items-center gap-1.5"><EditIcon /> Modifier</button>
        </div>
      </div>
    </div>
  )
}

function AdminItinerairesPage() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const [itineraires, setItineraires] = useState([])
  const [selected, setSelected] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadItineraires = async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('s_itineraire').select('*').order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    setItineraires(data || [])
    setLoading(false)
  }

  const loadDetail = async (id) => {
    if (!id) return
    setDetailLoading(true)
    setError(null)
    const { data: item, error: itemError } = await supabase.from('s_itineraire').select('*').eq('id_itineraire', id).single()
    if (itemError || !item) { setError(itemError?.message || 'Itinéraire introuvable.'); setDetailLoading(false); return }
    const { data: dayRows, error: dayError } = await supabase.from('s_itineraire_jour').select('*').eq('id_itineraire', id).order('jour_numero', { ascending: true })
    if (dayError) { setError(dayError.message); setDetailLoading(false); return }
    const ids = (dayRows || []).map((d) => d.id_jour)
    let stepRows = []
    if (ids.length) {
      const { data, error: stepError } = await supabase.from('s_itineraire_step').select('*').in('id_jour', ids).order('no_ordre', { ascending: true })
      if (stepError) { setError(stepError.message); setDetailLoading(false); return }
      stepRows = data || []
    }
    const byDay = Object.fromEntries((dayRows || []).map((d) => [d.id_jour, []]))
    stepRows.forEach((s) => { if (byDay[s.id_jour]) byDay[s.id_jour].push(s) })
    setSelected(item)
    setDays((dayRows || []).map((d) => ({ ...d, steps: byDay[d.id_jour] || [] })))
    setDetailLoading(false)
  }

  useEffect(() => { loadItineraires() }, [])
  useEffect(() => {
    if (routeId) loadDetail(routeId)
    else if (itineraires.length && !selected) loadDetail(itineraires[0].id_itineraire)
  }, [routeId, itineraires.length])

  const openItinerary = (item) => navigate(`/admin-itineraires/${item.id_itineraire}`)

  const openModal = (type, value, context = {}) => {
    setError(null)
    setModal({ type, ...context })
    setDraft(JSON.parse(JSON.stringify(value)))
  }

  const closeModal = () => { if (!saving) { setModal(null); setDraft(null); setError(null) } }
  const updateDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }))

  const save = async () => {
    if (!modal || !draft) return
    setSaving(true)
    setError(null)
    try {
      if (modal.type === 'itineraire') {
        const payload = {
          titre: draft.titre.trim(),
          pays: draft.pays.trim(),
          ville: draft.ville.trim() || null,
          description: draft.description.trim() || null,
          duree_totale_jour: draft.duree_totale_jour === '' ? null : Number(draft.duree_totale_jour),
          duree_totale_heure: draft.duree_totale_heure === '' ? null : Number(draft.duree_totale_heure),
          url_cover: draft.url_cover.trim() || null,
        }
        if (!payload.titre || !payload.pays) throw new Error('Le titre et le pays sont obligatoires.')
        const { error } = await supabase.from('s_itineraire').update(payload).eq('id_itineraire', selected.id_itineraire)
        if (error) throw error
        setSelected((current) => ({ ...current, ...payload }))
        setItineraires((current) => current.map((x) => x.id_itineraire === selected.id_itineraire ? { ...x, ...payload } : x))
      }
      if (modal.type === 'jour') {
        const payload = { titre: draft.titre.trim() || null, sous_titre: draft.sous_titre.trim() || null, jour_numero: Number(draft.jour_numero) }
        if (!Number.isInteger(payload.jour_numero) || payload.jour_numero < 1) throw new Error('Le numéro du jour doit être un entier positif.')
        const { error } = await supabase.from('s_itineraire_jour').update(payload).eq('id_jour', modal.id_jour)
        if (error) throw error
        setDays((current) => current.map((d) => d.id_jour === modal.id_jour ? { ...d, ...payload } : d).sort((a, b) => a.jour_numero - b.jour_numero))
      }
      if (modal.type === 'step') {
        const payload = {
          no_ordre: Number(draft.no_ordre),
          nom_etape: draft.nom_etape.trim(),
          lieu: draft.lieu.trim() || null,
          adresse: draft.adresse.trim() || null,
          heure: draft.heure.trim() || null,
          duree: draft.duree.trim() || null,
          url_cover: draft.url_cover.trim() || null,
        }
        if (!Number.isInteger(payload.no_ordre) || payload.no_ordre < 1) throw new Error('L’ordre doit être un entier positif.')
        if (!payload.nom_etape) throw new Error('Le nom de l’étape est obligatoire.')
        const { error } = await supabase.from('s_itineraire_step').update(payload).eq('id_segment', modal.id_segment)
        if (error) throw error
        setDays((current) => current.map((d) => d.id_jour === modal.id_jour
          ? { ...d, steps: d.steps.map((s) => s.id_segment === modal.id_segment ? { ...s, ...payload } : s).sort((a, b) => a.no_ordre - b.no_ordre) }
          : d
        ))
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer les modifications.')
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = useMemo(() => {
    if (!modal) return ''
    if (modal.type === 'itineraire') return 'Modifier l’itinéraire'
    if (modal.type === 'jour') return `Modifier le jour ${draft?.jour_numero ?? ''}`
    return `Modifier l’étape ${draft?.no_ordre ?? ''}`
  }, [modal, draft?.jour_numero, draft?.no_ordre])

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <button onClick={() => navigate('/itineraires')} className="text-xs text-navy/50 hover:text-coral mb-2">← Retour aux itinéraires</button>
            <h1 className="font-serif text-2xl text-navy">Administration des itinéraires</h1>
            <p className="text-sm text-navy/50 mt-1">Modification réservée à l’administrateur.</p>
          </div>
        </div>

        {error && !modal && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">{error}</div>}

        {loading ? (
          <div className="py-20 text-center text-sm text-navy/50">Chargement…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
            <div className="flex flex-col gap-3">
              {itineraires.map((item) => (
                <ItineraireCard key={item.id_itineraire} item={item} onEdit={openItinerary} />
              ))}
              {!itineraires.length && <div className="bg-white rounded-xl border border-navy/10 p-5 text-sm text-navy/50">Aucun itinéraire.</div>}
            </div>

            <div>
              {detailLoading || !selected ? (
                <div className="bg-white rounded-xl border border-navy/10 p-8 text-sm text-navy/50">Sélectionne un itinéraire.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-xl border border-navy/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-coral font-medium">Itinéraire</p>
                        <h2 className="font-serif text-xl text-navy mt-1">{selected.titre}</h2>
                        <p className="text-xs text-navy/50 mt-1">{selected.pays}{selected.ville ? ` — ${selected.ville}` : ''}</p>
                      </div>
                      <button onClick={() => openModal('itineraire', selected)} className="shrink-0 px-3 py-2 rounded-lg border border-navy/15 text-xs text-navy hover:bg-navy/5 flex items-center gap-1.5"><EditIcon /> Modifier</button>
                    </div>
                    {selected.description && <p className="text-sm text-navy/60 mt-3">{selected.description}</p>}
                  </div>

                  {days.map((day) => (
                    <div key={day.id_jour} className="bg-white rounded-xl border border-navy/10 p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-coral font-medium">Jour {day.jour_numero}</p>
                          <h3 className="font-serif text-lg text-navy mt-1">{day.titre || 'Jour sans titre'}</h3>
                          {day.sous_titre && <p className="text-xs text-navy/50 mt-1">{day.sous_titre}</p>}
                        </div>
                        <button onClick={() => openModal('jour', day, { id_jour: day.id_jour })} className="shrink-0 px-3 py-2 rounded-lg border border-navy/15 text-xs text-navy hover:bg-navy/5 flex items-center gap-1.5"><EditIcon /> Modifier</button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {day.steps.map((step) => (
                          <div key={step.id_segment} className="rounded-lg bg-navy/5 border border-navy/5 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex gap-3 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-coral text-white text-xs flex items-center justify-center shrink-0">{step.no_ordre}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-navy">{step.nom_etape}</p>
                                  <p className="text-xs text-navy/50 mt-1 truncate">{step.lieu || 'Lieu non renseigné'}{step.adresse ? ` · ${step.adresse}` : ''}</p>
                                  <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-navy/45">
                                    {step.heure && <span>{step.heure}</span>}
                                    {step.duree && <span>{step.duree}</span>}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => openModal('step', step, { id_jour: day.id_jour, id_segment: step.id_segment })} className="shrink-0 w-8 h-8 rounded-lg border border-navy/15 text-navy/60 hover:bg-white flex items-center justify-center" aria-label={`Modifier ${step.nom_etape}`}><EditIcon /></button>
                            </div>
                          </div>
                        ))}
                        {!day.steps.length && <p className="text-xs text-navy/40">Aucune étape.</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && draft && (
        <Modal title={modalTitle} onClose={closeModal} onSave={save} saving={saving} error={error}>
          {modal.type === 'itineraire' && (
            <div className="flex flex-col gap-3">
              <Field label="Titre" value={draft.titre} onChange={(v) => updateDraft('titre', v)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Pays" value={draft.pays} onChange={(v) => updateDraft('pays', v)} />
                <Field label="Ville" value={draft.ville} onChange={(v) => updateDraft('ville', v)} />
              </div>
              <Field label="Description" value={draft.description} onChange={(v) => updateDraft('description', v)} textarea />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Durée en jours" value={draft.duree_totale_jour} onChange={(v) => updateDraft('duree_totale_jour', v)} type="number" />
                <Field label="Durée en heures" value={draft.duree_totale_heure} onChange={(v) => updateDraft('duree_totale_heure', v)} type="number" />
              </div>
              <Field label="URL de couverture" value={draft.url_cover} onChange={(v) => updateDraft('url_cover', v)} />
            </div>
          )}

          {modal.type === 'jour' && (
            <div className="flex flex-col gap-3">
              <Field label="Numéro du jour" value={draft.jour_numero} onChange={(v) => updateDraft('jour_numero', v)} type="number" />
              <Field label="Titre du jour" value={draft.titre} onChange={(v) => updateDraft('titre', v)} />
              <Field label="Sous-titre" value={draft.sous_titre} onChange={(v) => updateDraft('sous_titre', v)} />
            </div>
          )}

          {modal.type === 'step' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ordre" value={draft.no_ordre} onChange={(v) => updateDraft('no_ordre', v)} type="number" />
                <Field label="Heure (facultative)" value={draft.heure} onChange={(v) => updateDraft('heure', v)} placeholder="ex. 09:00" />
              </div>
              <Field label="Nom de l’étape" value={draft.nom_etape} onChange={(v) => updateDraft('nom_etape', v)} />
              <PlaceField
                value={draft.lieu}
                onChange={(v) => updateDraft('lieu', v)}
                onSelect={(place) => {
                  updateDraft('lieu', place.display_name.split(',')[0])
                  updateDraft('adresse', place.display_name)
                }}
              />
              <Field label="Adresse" value={draft.adresse} onChange={(v) => updateDraft('adresse', v)} />
              <Field label="Durée (facultative)" value={draft.duree} onChange={(v) => updateDraft('duree', v)} placeholder="ex. 1h30" />
              <Field label="URL de couverture" value={draft.url_cover} onChange={(v) => updateDraft('url_cover', v)} />
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default function AdminItineraires() {
  return (
    <AdminRoute>
      <AdminItinerairesPage />
    </AdminRoute>
  )
}
