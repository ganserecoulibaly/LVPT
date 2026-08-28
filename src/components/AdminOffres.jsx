import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'

const inputClass =
  'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral'

const emptyVol = {
  aeroport_depart: '',
  aeroport_arrivee: '',
  date_depart: '',
  date_arrivee: '',
  compagnie: '',
  prix: '',
  duree_vol: '',
  nb_escale: 0,
  lien_resa: '',
  nb_adulte: 1,
  nb_enfant: 0,
  type_trajet: 'aller-retour',
  email_demandeur: '',
}

const emptyHebergement = {
  ville: '',
  quartier: '',
  type_hebergement: '',
  date_arrivee: '',
  date_depart: '',
  nb_nuit: '',
  prix_nuit: '',
  prix_totoal: '',
  nb_adulte: 1,
  nb_enfant: 0,
  lien_resa: '',
  email_demandeur: '',
}

// Page réservée à l'admin (voir garde is_admin dans App.jsx) — permet de
// saisir l'offre trouvée après une demande reçue via FlightHotelSearch,
// en identifiant la personne par son email (pas forcément un compte
// LVPT) plutôt que par pid. Le fonctionnement existant pour les vraies
// réservations d'utilisateurs connectés (pid rempli) reste inchangé
// ailleurs dans l'app.
export default function AdminOffres() {
  const [mode, setMode] = useState('vol')
  const [volForm, setVolForm] = useState(emptyVol)
  const [hebergementForm, setHebergementForm] = useState(emptyHebergement)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [vols, setVols] = useState([])
  const [hebergements, setHebergements] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  async function loadOffres() {
    setLoadingList(true)
    const [{ data: volsData }, { data: hebergementsData }] = await Promise.all([
      supabase.from('s_vol').select('*').not('email_demandeur', 'is', null).order('created_at', { ascending: false }),
      supabase.from('s_hebergement').select('*').not('email_demandeur', 'is', null).order('created_at', { ascending: false }),
    ])
    setVols(volsData || [])
    setHebergements(hebergementsData || [])
    setLoadingList(false)
  }

  useEffect(() => {
    loadOffres()
  }, [])

  function updateVol(field, value) {
    setVolForm((prev) => ({ ...prev, [field]: value }))
  }
  function updateHebergement(field, value) {
    setHebergementForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmitVol(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error: insertError } = await supabase.from('s_vol').insert({
      aeroport_depart: volForm.aeroport_depart.trim(),
      aeroport_arrivee: volForm.aeroport_arrivee.trim(),
      date_depart: volForm.date_depart || null,
      date_arrivee: volForm.date_arrivee || null,
      compagnie: volForm.compagnie.trim() || null,
      prix: volForm.prix ? parseFloat(volForm.prix) : null,
      duree_vol: volForm.duree_vol ? parseInt(volForm.duree_vol, 10) : null,
      nb_escale: volForm.nb_escale ? parseInt(volForm.nb_escale, 10) : 0,
      lien_resa: volForm.lien_resa.trim() || null,
      nb_adulte: parseInt(volForm.nb_adulte, 10) || 1,
      nb_enfant: parseInt(volForm.nb_enfant, 10) || 0,
      type_trajet: volForm.type_trajet,
      email_demandeur: volForm.email_demandeur.trim(),
      pid: null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setVolForm(emptyVol)
    setSuccess(true)
    setSaving(false)
    loadOffres()
    setTimeout(() => setSuccess(false), 2000)
  }

  async function handleSubmitHebergement(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error: insertError } = await supabase.from('s_hebergement').insert({
      ville: hebergementForm.ville.trim(),
      quartier: hebergementForm.quartier.trim() || null,
      type_hebergement: hebergementForm.type_hebergement.trim() || null,
      date_arrivee: hebergementForm.date_arrivee || null,
      date_depart: hebergementForm.date_depart || null,
      nb_nuit: hebergementForm.nb_nuit ? parseInt(hebergementForm.nb_nuit, 10) : null,
      prix_nuit: hebergementForm.prix_nuit ? parseFloat(hebergementForm.prix_nuit) : null,
      prix_totoal: hebergementForm.prix_totoal ? parseFloat(hebergementForm.prix_totoal) : null,
      nb_adulte: parseInt(hebergementForm.nb_adulte, 10) || 1,
      nb_enfant: parseInt(hebergementForm.nb_enfant, 10) || 0,
      lien_resa: hebergementForm.lien_resa.trim() || null,
      email_demandeur: hebergementForm.email_demandeur.trim(),
      pid: null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setHebergementForm(emptyHebergement)
    setSuccess(true)
    setSaving(false)
    loadOffres()
    setTimeout(() => setSuccess(false), 2000)
  }

  async function handleDelete(table, idField, id) {
    const confirmed = window.confirm('Supprimer cette offre ?')
    if (!confirmed) return
    await supabase.from(table).delete().eq(idField, id)
    loadOffres()
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-3xl mx-auto">
          <PageHeader />

          <h1 className="font-serif text-3xl text-navy mb-6">Offres pour demandes reçues</h1>

          <div className="flex gap-2 mb-8 bg-white rounded-full p-1 w-fit border border-navy/10">
            <button
              onClick={() => setMode('vol')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === 'vol' ? 'bg-coral text-white' : 'text-navy/60 hover:text-navy'
              }`}
            >
              Vol
            </button>
            <button
              onClick={() => setMode('hebergement')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === 'hebergement' ? 'bg-coral text-white' : 'text-navy/60 hover:text-navy'
              }`}
            >
              Hébergement
            </button>
          </div>

          {mode === 'vol' ? (
            <form onSubmit={handleSubmitVol} className="bg-white rounded-2xl p-6 mb-10 flex flex-col gap-3">
              <p className="font-serif text-lg text-navy mb-2">Ajouter une offre de vol</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Aéroport départ</label>
                  <input type="text" placeholder="Paris (CDG)" required className={inputClass}
                    value={volForm.aeroport_depart} onChange={(e) => updateVol('aeroport_depart', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Aéroport arrivée</label>
                  <input type="text" placeholder="New York (JFK)" required className={inputClass}
                    value={volForm.aeroport_arrivee} onChange={(e) => updateVol('aeroport_arrivee', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Date/heure départ</label>
                  <input type="datetime-local" required className={inputClass}
                    value={volForm.date_depart} onChange={(e) => updateVol('date_depart', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Date/heure arrivée</label>
                  <input type="datetime-local" required className={inputClass}
                    value={volForm.date_arrivee} onChange={(e) => updateVol('date_arrivee', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Compagnie</label>
                  <input type="text" placeholder="Air France" className={inputClass}
                    value={volForm.compagnie} onChange={(e) => updateVol('compagnie', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Prix (€)</label>
                  <input type="number" min="0" step="0.01" required className={inputClass}
                    value={volForm.prix} onChange={(e) => updateVol('prix', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Durée du vol (minutes)</label>
                  <input type="number" min="0" className={inputClass}
                    value={volForm.duree_vol} onChange={(e) => updateVol('duree_vol', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Nombre d'escales</label>
                  <input type="number" min="0" className={inputClass}
                    value={volForm.nb_escale} onChange={(e) => updateVol('nb_escale', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Adultes</label>
                  <input type="number" min="1" className={inputClass}
                    value={volForm.nb_adulte} onChange={(e) => updateVol('nb_adulte', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Enfants</label>
                  <input type="number" min="0" className={inputClass}
                    value={volForm.nb_enfant} onChange={(e) => updateVol('nb_enfant', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Type de trajet</label>
                  <select className={inputClass} value={volForm.type_trajet} onChange={(e) => updateVol('type_trajet', e.target.value)}>
                    <option value="aller-retour">Aller-retour</option>
                    <option value="aller-simple">Aller simple</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-navy/70 mb-1 block">Lien de réservation</label>
                  <input type="url" placeholder="https://..." className={inputClass}
                    value={volForm.lien_resa} onChange={(e) => updateVol('lien_resa', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-navy/70 mb-1 block">Email du demandeur</label>
                  <input type="email" placeholder="demandeur@email.com" required className={inputClass}
                    value={volForm.email_demandeur} onChange={(e) => updateVol('email_demandeur', e.target.value)} />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">Offre enregistrée !</p>}

              <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 mt-2 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer l\'offre'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitHebergement} className="bg-white rounded-2xl p-6 mb-10 flex flex-col gap-3">
              <p className="font-serif text-lg text-navy mb-2">Ajouter une offre d'hébergement</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Ville</label>
                  <input type="text" placeholder="New York" required className={inputClass}
                    value={hebergementForm.ville} onChange={(e) => updateHebergement('ville', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Quartier</label>
                  <input type="text" placeholder="Manhattan" className={inputClass}
                    value={hebergementForm.quartier} onChange={(e) => updateHebergement('quartier', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Type d'hébergement</label>
                  <input type="text" placeholder="Hôtel, Airbnb..." className={inputClass}
                    value={hebergementForm.type_hebergement} onChange={(e) => updateHebergement('type_hebergement', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Nombre de nuits</label>
                  <input type="number" min="1" required className={inputClass}
                    value={hebergementForm.nb_nuit} onChange={(e) => updateHebergement('nb_nuit', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Arrivée</label>
                  <input type="date" required className={inputClass}
                    value={hebergementForm.date_arrivee} onChange={(e) => updateHebergement('date_arrivee', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Départ</label>
                  <input type="date" required className={inputClass}
                    value={hebergementForm.date_depart} onChange={(e) => updateHebergement('date_depart', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Prix / nuit (€)</label>
                  <input type="number" min="0" step="0.01" required className={inputClass}
                    value={hebergementForm.prix_nuit} onChange={(e) => updateHebergement('prix_nuit', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Prix total (€)</label>
                  <input type="number" min="0" step="0.01" className={inputClass}
                    value={hebergementForm.prix_totoal} onChange={(e) => updateHebergement('prix_totoal', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Adultes</label>
                  <input type="number" min="1" className={inputClass}
                    value={hebergementForm.nb_adulte} onChange={(e) => updateHebergement('nb_adulte', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Enfants</label>
                  <input type="number" min="0" className={inputClass}
                    value={hebergementForm.nb_enfant} onChange={(e) => updateHebergement('nb_enfant', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-navy/70 mb-1 block">Lien de réservation</label>
                  <input type="url" placeholder="https://..." className={inputClass}
                    value={hebergementForm.lien_resa} onChange={(e) => updateHebergement('lien_resa', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-navy/70 mb-1 block">Email du demandeur</label>
                  <input type="email" placeholder="demandeur@email.com" required className={inputClass}
                    value={hebergementForm.email_demandeur} onChange={(e) => updateHebergement('email_demandeur', e.target.value)} />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">Offre enregistrée !</p>}

              <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 mt-2 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer l\'offre'}
              </button>
            </form>
          )}

          <p className="font-serif text-lg text-navy mb-4">
            Offres déjà envoyées ({mode === 'vol' ? vols.length : hebergements.length})
          </p>

          {loadingList ? (
            <p className="text-sm text-navy/50">Chargement…</p>
          ) : mode === 'vol' ? (
            vols.length === 0 ? (
              <p className="text-sm text-navy/50">Aucune offre de vol enregistrée pour l'instant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {vols.map((v) => (
                  <div key={v.id_vol} className="bg-white rounded-xl p-4 flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-navy">{v.aeroport_depart} → {v.aeroport_arrivee}</p>
                      <p className="text-navy/50 text-xs">{v.email_demandeur} · {v.prix}€</p>
                    </div>
                    <button onClick={() => handleDelete('s_vol', 'id_vol', v.id_vol)} className="text-xs text-red-500 hover:text-red-700">
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : hebergements.length === 0 ? (
            <p className="text-sm text-navy/50">Aucune offre d'hébergement enregistrée pour l'instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {hebergements.map((h) => (
                <div key={h.id_hebergement} className="bg-white rounded-xl p-4 flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-navy">{h.type_hebergement} à {h.ville}</p>
                    <p className="text-navy/50 text-xs">{h.email_demandeur} · {h.prix_nuit}€/nuit</p>
                  </div>
                  <button onClick={() => handleDelete('s_hebergement', 'id_hebergement', h.id_hebergement)} className="text-xs text-red-500 hover:text-red-700">
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
