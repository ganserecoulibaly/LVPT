import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import Footer from './Footer'

const TABLES = [
  { key: 'lieu', label: 'Lieux / visites / musées', table: 'd_lieu', id: 'id_lieu', title: 'nom', fields: ['nom', 'pays', 'ville', 'quartier'] },
  { key: 'plat', label: 'Gastronomie', table: 'd_plat', id: 'id_plat', title: 'nom_plat', fields: ['nom_plat', 'nom_restaurant', 'adresse_restaurant', 'ville', 'pays', 'prix', 'lien_photo', 'notes'] },
  { key: 'voyage_commun', label: 'Voyage commun', table: 's_voyage_commun', id: 'id_post', title: 'titre', fields: ['titre', 'pays', 'ville', 'description'] },
  { key: 'itineraire', label: 'Itinéraires', table: 's_itineraire', id: 'id_itineraire', title: 'titre', fields: ['titre', 'pays', 'ville', 'description', 'duree_totale_jour', 'duree_totale_heure'] },
]

function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
}

function fieldLabel(field) {
  return field.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function canEdit(record, userId, isAdmin) {
  return Boolean(isAdmin || record?.pid === userId)
}

export default function ContentManager() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [active, setActive] = useState('all')
  const [records, setRecords] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single().then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  const load = async () => {
    if (!user) return
    setError(null)
    const visibleTables = active === 'all' ? TABLES : TABLES.filter((x) => x.key === active)
    const results = await Promise.all(visibleTables.map(async (config) => {
      let query = supabase.from(config.table).select('*').order('created_at', { ascending: false })
      if (!isAdmin) query = query.eq('pid', user.id)
      const { data, error: queryError } = await query
      if (queryError) return { config, rows: [], error: queryError.message }
      return { config, rows: data || [], error: null }
    }))
    setRecords(results.flatMap(({ config, rows }) => rows.map((row) => ({ ...row, _config: config }))))
  }

  useEffect(() => { load() }, [user, isAdmin, active])

  const grouped = useMemo(() => TABLES.reduce((acc, config) => {
    acc[config.key] = records.filter((r) => r._config.key === config.key)
    return acc
  }, {}), [records])

  const openEdit = (record) => {
    if (!canEdit(record, user?.id, isAdmin)) return
    const values = {}
    record._config.fields.forEach((field) => { values[field] = record[field] ?? '' })
    setEditing(record)
    setDraft(values)
  }

  const save = async () => {
    if (!editing || !canEdit(editing, user?.id, isAdmin)) return
    setSaving(true)
    setError(null)
    const payload = { ...draft }
    Object.keys(payload).forEach((key) => { if (payload[key] === '') payload[key] = null })
    if ('updated_at' in editing) payload.updated_at = new Date().toISOString()
    const { error: updateError } = await supabase
      .from(editing._config.table)
      .update(payload)
      .eq(editing._config.id, editing[editing._config.id])
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setEditing(null)
    await load()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />
      <main className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-6xl mx-auto">
          <PageHeader isAdmin={isAdmin} />
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-coral font-medium">Contenus</p>
              <h1 className="font-serif text-3xl text-navy">{isAdmin ? 'Gestion de tous les contenus' : 'Mes contenus'}</h1>
              <p className="text-sm text-navy/55 mt-1">{isAdmin ? 'Tu peux modifier les contenus créés par tous les utilisateurs.' : 'Tu peux modifier uniquement les contenus que tu as créés.'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActive('all')} className={`px-3 py-1.5 rounded-full text-xs border ${active === 'all' ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/65'}`}>Tous</button>
            {TABLES.map((config) => <button key={config.key} onClick={() => setActive(config.key)} className={`px-3 py-1.5 rounded-full text-xs border ${active === config.key ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/65'}`}>{config.label}</button>)}
          </div>

          {TABLES.map((config) => {
            const rows = grouped[config.key] || []
            if (active !== 'all' && active !== config.key) return null
            return (
              <section key={config.key} className="mb-8">
                <h2 className="font-serif text-xl text-navy mb-3">{config.label}</h2>
                {rows.length === 0 ? <p className="text-sm text-navy/40">Aucun contenu.</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.map((record) => {
                      const editable = canEdit(record, user.id, isAdmin)
                      return (
                        <article key={record[config.id]} className="bg-white border border-navy/10 rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wide text-navy/40">{config.label}</p>
                              <h3 className="font-serif text-lg text-navy mt-1 truncate">{record[config.title] || 'Sans titre'}</h3>
                              <p className="text-xs text-navy/45 mt-1">{record.pays || record.ville || ''}</p>
                            </div>
                            {editable && <button onClick={() => openEdit(record)} className="shrink-0 w-8 h-8 rounded-full bg-cream text-navy/65 flex items-center justify-center hover:bg-navy/5" aria-label="Modifier"><EditIcon /></button>}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-[1000] bg-navy/45 flex items-center justify-center p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-coral">Modifier</p>
                <h2 className="font-serif text-xl text-navy">{editing._config.label}</h2>
              </div>
              <button onClick={() => setEditing(null)} disabled={saving} className="text-navy/40">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {editing._config.fields.map((field) => (
                <label key={field} className="text-xs text-navy/65">
                  {fieldLabel(field)}
                  {field === 'description' || field === 'notes' ? (
                    <textarea value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} rows={4} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy" />
                  ) : (
                    <input value={draft[field] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} className="mt-1 w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm text-navy" />
                  )}
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <button onClick={save} disabled={saving} className="btn-primary w-full justify-center mt-5 disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
