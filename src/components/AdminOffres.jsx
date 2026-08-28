import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import CreateItineraireModal from './CreateItineraireModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import AjouterMusiqueModal from './AjouterMusiqueModal'
import AjouterPlatModal from './AjouterPlatModal'
import AjouterLieuModal from './AjouterLieuModal'

const inputClass =
  'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Même source que Depenses.jsx — cohérence sur toute l'app.
const CURRENCY_API_PRIMARY = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'
const CURRENCY_API_FALLBACK = 'https://latest.currency-api.pages.dev/v1/currencies'
const CURRENCY_LABELS = {
  EUR: 'Euro', USD: 'Dollar américain', GBP: 'Livre sterling', JPY: 'Yen japonais',
  CHF: 'Franc suisse', CAD: 'Dollar canadien', AUD: 'Dollar australien', CNY: 'Yuan chinois',
  MXN: 'Peso mexicain', THB: 'Baht thaïlandais', SGD: 'Dollar singapourien', HKD: 'Dollar de Hong Kong',
  INR: 'Roupie indienne', KRW: 'Won sud-coréen', TRY: 'Livre turque', ZAR: 'Rand sud-africain',
  BRL: 'Real brésilien', NZD: 'Dollar néo-zélandais', SEK: 'Couronne suédoise', NOK: 'Couronne norvégienne',
  DKK: 'Couronne danoise', PLN: 'Zloty polonais', ILS: 'Shekel israélien', IDR: 'Roupie indonésienne',
  MYR: 'Ringgit malaisien', PHP: 'Peso philippin', CZK: 'Couronne tchèque',
}
const COMMON_CURRENCIES = Object.entries(CURRENCY_LABELS).sort((a, b) => a[1].localeCompare(b[1], 'fr')).map(([code]) => code)
const CATEGORIES_DEPENSE = [
  'Vol', 'Train', 'Bus / Car', 'Voiture', 'Hébergement', 'Restaurant',
  'Visites / Activités', 'Transport local', 'Souvenirs / Shopping',
  'Visa', 'Assurance voyage', 'Autre',
]

async function fetchCurrencyRates(fromCode) {
  const code = fromCode.toLowerCase()
  let response
  try {
    response = await fetch(`${CURRENCY_API_PRIMARY}/${code}.json`)
    if (!response.ok) throw new Error('primary failed')
  } catch {
    response = await fetch(`${CURRENCY_API_FALLBACK}/${code}.json`)
  }
  if (!response.ok) throw new Error('Réponse invalide')
  const data = await response.json()
  return data[code]
}

const SECTIONS = [
  { key: 'vol', label: 'Vol' },
  { key: 'hebergement', label: 'Hébergement' },
  { key: 'sejour', label: 'Séjour' },
  { key: 'voyage_commun', label: 'Voyage Commun' },
  { key: 'itineraire', label: 'Itinéraire' },
  { key: 'depense', label: 'Dépense' },
  { key: 'playlist', label: 'Playlist' },
  { key: 'gastronomie', label: 'Carnet gastronomique' },
  { key: 'activites', label: 'Activités' },
]

const emptyVol = {
  aeroport_depart: '', aeroport_arrivee: '', date_depart: '', date_arrivee: '',
  compagnie: '', prix: '', duree_vol: '', nb_escale: 0, lien_resa: '',
  nb_adulte: 1, nb_enfant: 0, type_trajet: 'aller-retour', demandeur: '',
}
const emptyHebergement = {
  ville: '', quartier: '', type_hebergement: '', date_arrivee: '', date_depart: '',
  nb_nuit: '', prix_nuit: '', prix_totoal: '', nb_adulte: 1, nb_enfant: 0,
  lien_resa: '', demandeur: '',
}
const emptySejour = {
  pays: '', ville: '', date_debut: '', date_fin: '', nb_nuits: '',
  moyen_transport: 'Vol', compagnie_transport: '', nom_hebergement: '',
  type_hebergement: '', prix_personne: '', lien_offre: '',
}

// Page réservée à l'admin (le lien n'apparaît que pour is_admin dans la
// Sidebar) — hub centralisant l'ajout de contenu pour toutes les sections
// que l'admin alimente lui-même. Vol/Hébergement/Séjour ont leur propre
// formulaire (aucun n'existait côté utilisateur pour Séjour). Les 5
// autres sections réutilisent exactement les modales déjà existantes
// côté utilisateur, avec le pid de l'admin lui-même.
export default function AdminOffres() {
  const [section, setSection] = useState('vol')
  const [adminId, setAdminId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAdminId(user?.id || null))
  }, [])

  // --- Vol / Hébergement ---
  const [volForm, setVolForm] = useState(emptyVol)
  const [hebergementForm, setHebergementForm] = useState(emptyHebergement)
  const [savingVolHeb, setSavingVolHeb] = useState(false)
  const [errorVolHeb, setErrorVolHeb] = useState(null)
  const [successVolHeb, setSuccessVolHeb] = useState(false)
  const [vols, setVols] = useState([])
  const [hebergements, setHebergements] = useState([])

  async function loadOffresVolHeb() {
    const [{ data: volsData }, { data: hebergementsData }] = await Promise.all([
      supabase.from('s_vol').select('*, lvpt(email, prenom, nom)').order('created_at', { ascending: false }).limit(20),
      supabase.from('s_hebergement').select('*, lvpt(email, prenom, nom)').order('created_at', { ascending: false }).limit(20),
    ])
    setVols(volsData || [])
    setHebergements(hebergementsData || [])
  }
  useEffect(() => { loadOffresVolHeb() }, [])

  async function resolvePid(demandeur) {
    const trimmed = demandeur.trim()
    if (!trimmed) return { pid: null, error: "Merci d'indiquer l'email ou le pid du demandeur." }
    if (UUID_REGEX.test(trimmed)) {
      const { data, error } = await supabase.from('lvpt').select('id').eq('id', trimmed).single()
      if (error || !data) return { pid: null, error: 'Aucun compte trouvé avec ce pid.' }
      return { pid: data.id, error: null }
    }
    const { data, error } = await supabase.from('lvpt').select('id').eq('email', trimmed).single()
    if (error || !data) return { pid: null, error: 'Aucun compte trouvé avec cet email.' }
    return { pid: data.id, error: null }
  }

  const handleSubmitVol = async (e) => {
    e.preventDefault()
    setErrorVolHeb(null)
    setSavingVolHeb(true)
    const { pid, error: resolveError } = await resolvePid(volForm.demandeur)
    if (resolveError) { setErrorVolHeb(resolveError); setSavingVolHeb(false); return }
    const { error: insertError } = await supabase.from('s_vol').insert({
      pid,
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
    })
    if (insertError) { setErrorVolHeb(insertError.message); setSavingVolHeb(false); return }
    setVolForm(emptyVol)
    setSuccessVolHeb(true)
    setSavingVolHeb(false)
    loadOffresVolHeb()
    setTimeout(() => setSuccessVolHeb(false), 2000)
  }

  const handleSubmitHebergement = async (e) => {
    e.preventDefault()
    setErrorVolHeb(null)
    setSavingVolHeb(true)
    const { pid, error: resolveError } = await resolvePid(hebergementForm.demandeur)
    if (resolveError) { setErrorVolHeb(resolveError); setSavingVolHeb(false); return }
    const { error: insertError } = await supabase.from('s_hebergement').insert({
      pid,
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
    })
    if (insertError) { setErrorVolHeb(insertError.message); setSavingVolHeb(false); return }
    setHebergementForm(emptyHebergement)
    setSuccessVolHeb(true)
    setSavingVolHeb(false)
    loadOffresVolHeb()
    setTimeout(() => setSuccessVolHeb(false), 2000)
  }

  const handleDeleteVolHeb = async (table, idField, id) => {
    if (!window.confirm('Supprimer cette offre ?')) return
    await supabase.from(table).delete().eq(idField, id)
    loadOffresVolHeb()
  }

  // --- Séjour ---
  const [sejourForm, setSejourForm] = useState(emptySejour)
  const [savingSejour, setSavingSejour] = useState(false)
  const [errorSejour, setErrorSejour] = useState(null)
  const [successSejour, setSuccessSejour] = useState(false)

  const updateSejour = (field, value) => setSejourForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmitSejour = async (e) => {
    e.preventDefault()
    setErrorSejour(null)
    setSavingSejour(true)
    const { error: insertError } = await supabase.from('d_sejour').insert({
      pays: sejourForm.pays.trim(),
      ville: sejourForm.ville.trim(),
      date_debut: sejourForm.date_debut || null,
      date_fin: sejourForm.date_fin || null,
      nb_nuits: sejourForm.nb_nuits ? parseInt(sejourForm.nb_nuits, 10) : null,
      moyen_transport: sejourForm.moyen_transport,
      compagnie_transport: sejourForm.compagnie_transport.trim() || null,
      nom_hebergement: sejourForm.nom_hebergement.trim() || null,
      type_hebergement: sejourForm.type_hebergement.trim() || null,
      prix_personne: sejourForm.prix_personne ? parseFloat(sejourForm.prix_personne) : null,
      lien_offre: sejourForm.lien_offre.trim() || null,
      actif: true,
    })
    if (insertError) { setErrorSejour(insertError.message); setSavingSejour(false); return }
    setSejourForm(emptySejour)
    setSuccessSejour(true)
    setSavingSejour(false)
    setTimeout(() => setSuccessSejour(false), 2000)
  }

  // --- Voyage Commun / Itinéraire / Playlist / Gastronomie / Activités ---
  // Réutilisent directement les modales existantes côté utilisateur.
  const [voyageCommunOpen, setVoyageCommunOpen] = useState(false)
  const [itineraireOpen, setItineraireOpen] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [gastronomieOpen, setGastronomieOpen] = useState(false)
  const [activitesOpen, setActivitesOpen] = useState(false)

  // --- Dépense --- reproduit fidèlement le flux de Depenses.jsx, tel
  // qu'il apparaît sur le propre compte de l'admin.
  const [voyages, setVoyages] = useState([])
  const [depenses, setDepenses] = useState([])
  const [newVille, setNewVille] = useState('')
  const [newPays, setNewPays] = useState('')
  const [newDuree, setNewDuree] = useState('')
  const [voyageError, setVoyageError] = useState(null)
  const [creatingVoyage, setCreatingVoyage] = useState(false)
  const [intitule, setIntitule] = useState('')
  const [montant, setMontant] = useState('')
  const [devise, setDevise] = useState('EUR')
  const [categorieDepense, setCategorieDepense] = useState(CATEGORIES_DEPENSE[0])
  const [savingDepense, setSavingDepense] = useState(false)
  const [errorDepense, setErrorDepense] = useState(null)

  const loadVoyages = () => {
    if (!adminId) return
    supabase.from('s_voyage').select('*').eq('pid', adminId).order('created_at', { ascending: false })
      .then(({ data }) => setVoyages(data || []))
  }
  const loadDepenses = () => {
    if (!adminId) return
    supabase.from('s_depense').select('*').eq('pid', adminId).order('date_depense', { ascending: false })
      .then(({ data }) => setDepenses(data || []))
  }
  useEffect(() => { if (adminId) { loadVoyages(); loadDepenses() } }, [adminId])

  const currentVoyage = voyages.find((v) => !v.cloture) || null
  const depensesCourantes = depenses.filter((d) => d.id_voyage === currentVoyage?.id_voyage)

  const normaliserCasse = (texte) =>
    texte.trim().split(/\s+/).map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase()).join(' ')

  const handleCreateVoyage = async () => {
    if (!newVille.trim() || !newPays.trim() || !newDuree || Number(newDuree) <= 0) {
      setVoyageError('Renseigne une destination et une durée valide.')
      return
    }
    setCreatingVoyage(true)
    setVoyageError(null)
    const { error: insertError } = await supabase.from('s_voyage').insert({
      pid: adminId,
      destination_ville: normaliserCasse(newVille),
      destination_pays: normaliserCasse(newPays),
      duree_jours: Number(newDuree),
    })
    setCreatingVoyage(false)
    if (insertError) { setVoyageError('Impossible de créer ce voyage pour le moment.'); return }
    setNewVille(''); setNewPays(''); setNewDuree('')
    loadVoyages()
  }

  const handleAddDepense = async () => {
    if (!currentVoyage) { setErrorDepense("Renseigne d'abord le voyage (destination + durée) ci-dessus."); return }
    if (!intitule.trim() || !montant || Number(montant) <= 0) { setErrorDepense('Renseigne un intitulé et un montant valide.'); return }
    setSavingDepense(true)
    setErrorDepense(null)
    try {
      let montantEur = Number(montant)
      let taux = 1
      if (devise !== 'EUR') {
        const rates = await fetchCurrencyRates(devise)
        taux = rates?.eur
        if (!taux) throw new Error('Taux de conversion introuvable pour cette devise.')
        montantEur = Number(montant) * taux
      }
      const { error: insertError } = await supabase.from('s_depense').insert({
        pid: adminId,
        id_voyage: currentVoyage.id_voyage,
        intitule: intitule.trim(),
        categorie: categorieDepense,
        montant: Number(montant),
        devise,
        montant_eur: montantEur,
        taux_conversion: taux,
      })
      if (insertError) throw insertError
      setIntitule(''); setMontant('')
      loadDepenses()
    } catch (err) {
      setErrorDepense(err.message || "Impossible d'ajouter la dépense pour le moment.")
    } finally {
      setSavingDepense(false)
    }
  }

  const handleEndVoyageAdmin = async () => {
    if (!currentVoyage) return
    await supabase.from('s_voyage').update({ cloture: true }).eq('id_voyage', currentVoyage.id_voyage)
    loadVoyages()
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-3xl mx-auto">
          <PageHeader />

          <h1 className="font-serif text-3xl text-navy mb-6">Ajouter du contenu</h1>

          <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-navy/10">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  section === s.key ? 'bg-coral text-white' : 'text-navy/60 hover:text-navy'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* --- VOL --- */}
          {section === 'vol' && (
            <>
              <form onSubmit={handleSubmitVol} className="bg-white rounded-2xl p-6 mb-8 flex flex-col gap-3">
                <p className="font-serif text-lg text-navy mb-2">Ajouter une offre de vol</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-navy/70 mb-1 block">Email ou pid du demandeur</label>
                    <input type="text" placeholder="demandeur@email.com ou uuid" required className={inputClass}
                      value={volForm.demandeur} onChange={(e) => setVolForm((p) => ({ ...p, demandeur: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Aéroport départ</label>
                    <input type="text" placeholder="Paris (CDG)" required className={inputClass}
                      value={volForm.aeroport_depart} onChange={(e) => setVolForm((p) => ({ ...p, aeroport_depart: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Aéroport arrivée</label>
                    <input type="text" placeholder="New York (JFK)" required className={inputClass}
                      value={volForm.aeroport_arrivee} onChange={(e) => setVolForm((p) => ({ ...p, aeroport_arrivee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Date/heure départ</label>
                    <input type="datetime-local" required className={inputClass}
                      value={volForm.date_depart} onChange={(e) => setVolForm((p) => ({ ...p, date_depart: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Date/heure arrivée</label>
                    <input type="datetime-local" required className={inputClass}
                      value={volForm.date_arrivee} onChange={(e) => setVolForm((p) => ({ ...p, date_arrivee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Compagnie</label>
                    <input type="text" placeholder="Air France" className={inputClass}
                      value={volForm.compagnie} onChange={(e) => setVolForm((p) => ({ ...p, compagnie: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Prix (€)</label>
                    <input type="number" min="0" step="0.01" required className={inputClass}
                      value={volForm.prix} onChange={(e) => setVolForm((p) => ({ ...p, prix: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Durée du vol (minutes)</label>
                    <input type="number" min="0" className={inputClass}
                      value={volForm.duree_vol} onChange={(e) => setVolForm((p) => ({ ...p, duree_vol: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Nombre d'escales</label>
                    <input type="number" min="0" className={inputClass}
                      value={volForm.nb_escale} onChange={(e) => setVolForm((p) => ({ ...p, nb_escale: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Adultes</label>
                    <input type="number" min="1" className={inputClass}
                      value={volForm.nb_adulte} onChange={(e) => setVolForm((p) => ({ ...p, nb_adulte: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Enfants</label>
                    <input type="number" min="0" className={inputClass}
                      value={volForm.nb_enfant} onChange={(e) => setVolForm((p) => ({ ...p, nb_enfant: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Type de trajet</label>
                    <select className={inputClass} value={volForm.type_trajet} onChange={(e) => setVolForm((p) => ({ ...p, type_trajet: e.target.value }))}>
                      <option value="aller-retour">Aller-retour</option>
                      <option value="aller-simple">Aller simple</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-navy/70 mb-1 block">Lien de réservation</label>
                    <input type="url" placeholder="https://..." className={inputClass}
                      value={volForm.lien_resa} onChange={(e) => setVolForm((p) => ({ ...p, lien_resa: e.target.value }))} />
                  </div>
                </div>
                {errorVolHeb && <p className="text-sm text-red-600">{errorVolHeb}</p>}
                {successVolHeb && <p className="text-sm text-green-600">Offre enregistrée !</p>}
                <button type="submit" disabled={savingVolHeb} className="btn-primary text-sm py-2.5 mt-2 disabled:opacity-60">
                  {savingVolHeb ? 'Enregistrement…' : "Enregistrer l'offre"}
                </button>
              </form>

              <p className="font-serif text-lg text-navy mb-4">Dernières offres de vol</p>
              {vols.length === 0 ? (
                <p className="text-sm text-navy/50">Aucune offre enregistrée pour l'instant.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {vols.map((v) => (
                    <div key={v.id_vol} className="bg-white rounded-xl p-4 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-navy">{v.aeroport_depart} → {v.aeroport_arrivee}</p>
                        <p className="text-navy/50 text-xs">
                          {v.lvpt ? `${v.lvpt.prenom || ''} ${v.lvpt.nom || ''} (${v.lvpt.email})` : v.pid} · {v.prix}€
                        </p>
                      </div>
                      <button onClick={() => handleDeleteVolHeb('s_vol', 'id_vol', v.id_vol)} className="text-xs text-red-500 hover:text-red-700">
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* --- HÉBERGEMENT --- */}
          {section === 'hebergement' && (
            <>
              <form onSubmit={handleSubmitHebergement} className="bg-white rounded-2xl p-6 mb-8 flex flex-col gap-3">
                <p className="font-serif text-lg text-navy mb-2">Ajouter une offre d'hébergement</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-navy/70 mb-1 block">Email ou pid du demandeur</label>
                    <input type="text" placeholder="demandeur@email.com ou uuid" required className={inputClass}
                      value={hebergementForm.demandeur} onChange={(e) => setHebergementForm((p) => ({ ...p, demandeur: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Ville</label>
                    <input type="text" placeholder="New York" required className={inputClass}
                      value={hebergementForm.ville} onChange={(e) => setHebergementForm((p) => ({ ...p, ville: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Quartier</label>
                    <input type="text" placeholder="Manhattan" className={inputClass}
                      value={hebergementForm.quartier} onChange={(e) => setHebergementForm((p) => ({ ...p, quartier: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Type d'hébergement</label>
                    <input type="text" placeholder="Hôtel, Airbnb..." className={inputClass}
                      value={hebergementForm.type_hebergement} onChange={(e) => setHebergementForm((p) => ({ ...p, type_hebergement: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Nombre de nuits</label>
                    <input type="number" min="1" required className={inputClass}
                      value={hebergementForm.nb_nuit} onChange={(e) => setHebergementForm((p) => ({ ...p, nb_nuit: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Arrivée</label>
                    <input type="date" required className={inputClass}
                      value={hebergementForm.date_arrivee} onChange={(e) => setHebergementForm((p) => ({ ...p, date_arrivee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Départ</label>
                    <input type="date" required className={inputClass}
                      value={hebergementForm.date_depart} onChange={(e) => setHebergementForm((p) => ({ ...p, date_depart: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Prix / nuit (€)</label>
                    <input type="number" min="0" step="0.01" required className={inputClass}
                      value={hebergementForm.prix_nuit} onChange={(e) => setHebergementForm((p) => ({ ...p, prix_nuit: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Prix total (€)</label>
                    <input type="number" min="0" step="0.01" className={inputClass}
                      value={hebergementForm.prix_totoal} onChange={(e) => setHebergementForm((p) => ({ ...p, prix_totoal: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Adultes</label>
                    <input type="number" min="1" className={inputClass}
                      value={hebergementForm.nb_adulte} onChange={(e) => setHebergementForm((p) => ({ ...p, nb_adulte: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-navy/70 mb-1 block">Enfants</label>
                    <input type="number" min="0" className={inputClass}
                      value={hebergementForm.nb_enfant} onChange={(e) => setHebergementForm((p) => ({ ...p, nb_enfant: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-navy/70 mb-1 block">Lien de réservation</label>
                    <input type="url" placeholder="https://..." className={inputClass}
                      value={hebergementForm.lien_resa} onChange={(e) => setHebergementForm((p) => ({ ...p, lien_resa: e.target.value }))} />
                  </div>
                </div>
                {errorVolHeb && <p className="text-sm text-red-600">{errorVolHeb}</p>}
                {successVolHeb && <p className="text-sm text-green-600">Offre enregistrée !</p>}
                <button type="submit" disabled={savingVolHeb} className="btn-primary text-sm py-2.5 mt-2 disabled:opacity-60">
                  {savingVolHeb ? 'Enregistrement…' : "Enregistrer l'offre"}
                </button>
              </form>

              <p className="font-serif text-lg text-navy mb-4">Dernières offres d'hébergement</p>
              {hebergements.length === 0 ? (
                <p className="text-sm text-navy/50">Aucune offre enregistrée pour l'instant.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {hebergements.map((h) => (
                    <div key={h.id_hebergement} className="bg-white rounded-xl p-4 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-navy">{h.type_hebergement} à {h.ville}</p>
                        <p className="text-navy/50 text-xs">
                          {h.lvpt ? `${h.lvpt.prenom || ''} ${h.lvpt.nom || ''} (${h.lvpt.email})` : h.pid} · {h.prix_nuit}€/nuit
                        </p>
                      </div>
                      <button onClick={() => handleDeleteVolHeb('s_hebergement', 'id_hebergement', h.id_hebergement)} className="text-xs text-red-500 hover:text-red-700">
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* --- SÉJOUR --- */}
          {section === 'sejour' && (
            <form onSubmit={handleSubmitSejour} className="bg-white rounded-2xl p-6 flex flex-col gap-3">
              <p className="font-serif text-lg text-navy mb-2">Ajouter un séjour</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Pays</label>
                  <input type="text" required className={inputClass}
                    value={sejourForm.pays} onChange={(e) => updateSejour('pays', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Ville</label>
                  <input type="text" required className={inputClass}
                    value={sejourForm.ville} onChange={(e) => updateSejour('ville', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Date début</label>
                  <input type="date" required className={inputClass}
                    value={sejourForm.date_debut} onChange={(e) => updateSejour('date_debut', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Date fin</label>
                  <input type="date" required className={inputClass}
                    value={sejourForm.date_fin} onChange={(e) => updateSejour('date_fin', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Nombre de nuits</label>
                  <input type="number" min="1" required className={inputClass}
                    value={sejourForm.nb_nuits} onChange={(e) => updateSejour('nb_nuits', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Prix / personne (€)</label>
                  <input type="number" min="0" step="0.01" required className={inputClass}
                    value={sejourForm.prix_personne} onChange={(e) => updateSejour('prix_personne', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Moyen de transport</label>
                  <select className={inputClass} value={sejourForm.moyen_transport} onChange={(e) => updateSejour('moyen_transport', e.target.value)}>
                    <option value="Vol">Vol</option>
                    <option value="Train">Train</option>
                    <option value="Voiture">Voiture</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Compagnie de transport</label>
                  <input type="text" placeholder="Air France, SNCF..." className={inputClass}
                    value={sejourForm.compagnie_transport} onChange={(e) => updateSejour('compagnie_transport', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Nom de l'hébergement</label>
                  <input type="text" className={inputClass}
                    value={sejourForm.nom_hebergement} onChange={(e) => updateSejour('nom_hebergement', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-navy/70 mb-1 block">Type d'hébergement</label>
                  <input type="text" placeholder="Hôtel, Airbnb..." className={inputClass}
                    value={sejourForm.type_hebergement} onChange={(e) => updateSejour('type_hebergement', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-navy/70 mb-1 block">Lien de l'offre</label>
                  <input type="url" placeholder="https://..." className={inputClass}
                    value={sejourForm.lien_offre} onChange={(e) => updateSejour('lien_offre', e.target.value)} />
                </div>
              </div>
              {errorSejour && <p className="text-sm text-red-600">{errorSejour}</p>}
              {successSejour && <p className="text-sm text-green-600">Séjour publié !</p>}
              <button type="submit" disabled={savingSejour} className="btn-primary text-sm py-2.5 mt-2 disabled:opacity-60">
                {savingSejour ? 'Publication…' : 'Publier le séjour'}
              </button>
            </form>
          )}

          {/* --- VOYAGE COMMUN --- */}
          {section === 'voyage_commun' && (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-navy mb-4">Voyage Commun</p>
              <p className="text-sm text-navy/60 mb-5">Ouvre le même formulaire que côté utilisateur pour partager un post.</p>
              <button onClick={() => setVoyageCommunOpen(true)} className="btn-primary text-sm py-2.5 px-6">
                + Partager un post
              </button>
            </div>
          )}

          {/* --- ITINÉRAIRE --- */}
          {section === 'itineraire' && (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-navy mb-4">Itinéraire</p>
              <p className="text-sm text-navy/60 mb-5">Ouvre le même formulaire que côté utilisateur pour créer un itinéraire.</p>
              <button onClick={() => setItineraireOpen(true)} className="btn-primary text-sm py-2.5 px-6">
                + Créer un itinéraire
              </button>
            </div>
          )}

          {/* --- DÉPENSE --- */}
          {section === 'depense' && (
            <>
              {!currentVoyage ? (
                <div className="bg-white border border-navy/10 rounded-xl p-4">
                  <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Ton voyage</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input type="text" placeholder="Pays (ex : Maroc)" value={newPays} onChange={(e) => setNewPays(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Ville (ex : Marrakech)" value={newVille} onChange={(e) => setNewVille(e.target.value)} className={inputClass} />
                    <input type="number" min="1" placeholder="Durée (jours)" value={newDuree} onChange={(e) => setNewDuree(e.target.value)} className={inputClass} />
                  </div>
                  {voyageError && <p className="text-xs text-red-600 mb-2">{voyageError}</p>}
                  <button onClick={handleCreateVoyage} disabled={creatingVoyage} className="btn-primary text-sm py-2 px-5 disabled:opacity-60">
                    {creatingVoyage ? 'Création…' : 'Commencer ce voyage'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-navy/70">
                      {currentVoyage.destination_ville}, {currentVoyage.destination_pays} · {currentVoyage.duree_jours} jour{currentVoyage.duree_jours > 1 ? 's' : ''}
                    </p>
                    <button onClick={handleEndVoyageAdmin} className="text-xs text-navy/60 border border-navy/15 rounded-full px-3 py-1.5 hover:bg-navy/5 transition-colors">
                      Terminer le voyage
                    </button>
                  </div>

                  <div className="bg-white border border-navy/10 rounded-xl p-4">
                    <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Nouvelle dépense</p>
                    <input type="text" placeholder="Intitulé (ex : Dîner à Rome)" value={intitule} onChange={(e) => setIntitule(e.target.value)} className={`${inputClass} mb-2`} />
                    <div className="flex gap-2 mb-2">
                      <input type="number" min="0" step="0.01" placeholder="Montant" value={montant} onChange={(e) => setMontant(e.target.value)} className={`${inputClass} flex-1`} />
                      <select value={devise} onChange={(e) => setDevise(e.target.value)} className="w-28 px-2 py-2.5 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                        {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c} — {CURRENCY_LABELS[c]}</option>)}
                      </select>
                    </div>
                    <select value={categorieDepense} onChange={(e) => setCategorieDepense(e.target.value)} className={`${inputClass} bg-white mb-2`}>
                      {CATEGORIES_DEPENSE.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errorDepense && <p className="text-xs text-red-600 mb-2">{errorDepense}</p>}
                    <button onClick={handleAddDepense} disabled={savingDepense} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
                      {savingDepense ? 'Ajout…' : '+ Ajouter'}
                    </button>
                  </div>

                  {depensesCourantes.length > 0 && (
                    <div className="mt-4 bg-white border border-navy/10 rounded-xl p-4">
                      <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Dépenses de ce voyage ({depensesCourantes.length})</p>
                      <div className="flex flex-col">
                        {depensesCourantes.map((d) => (
                          <div key={d.id_depense} className="flex items-center justify-between py-2 border-b border-navy/5 last:border-0">
                            <p className="text-sm text-navy">{d.intitule} <span className="text-navy/40 text-xs">· {d.categorie}</span></p>
                            <p className="text-sm font-medium text-navy">{Number(d.montant_eur).toFixed(0)}€</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* --- PLAYLIST --- */}
          {section === 'playlist' && (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-navy mb-4">Playlist du voyage</p>
              <p className="text-sm text-navy/60 mb-5">Ouvre le même formulaire que côté utilisateur pour ajouter un morceau.</p>
              <button onClick={() => setPlaylistOpen(true)} className="btn-primary text-sm py-2.5 px-6">
                + Ajouter une musique
              </button>
            </div>
          )}

          {/* --- CARNET GASTRONOMIQUE --- */}
          {section === 'gastronomie' && (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-navy mb-4">Carnet gastronomique</p>
              <p className="text-sm text-navy/60 mb-5">Ouvre le même formulaire que côté utilisateur pour ajouter un plat.</p>
              <button onClick={() => setGastronomieOpen(true)} className="btn-primary text-sm py-2.5 px-6">
                + Ajouter un plat
              </button>
            </div>
          )}

          {/* --- ACTIVITÉS --- */}
          {section === 'activites' && (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-navy mb-4">Activités & musées</p>
              <p className="text-sm text-navy/60 mb-5">Ouvre le même formulaire que côté utilisateur pour ajouter un lieu.</p>
              <button onClick={() => setActivitesOpen(true)} className="btn-primary text-sm py-2.5 px-6">
                + Ajouter un lieu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales réutilisées telles quelles, avec le pid de l'admin */}
      {voyageCommunOpen && adminId && (
        <CreateVoyageCommunModal userId={adminId} onClose={() => setVoyageCommunOpen(false)} onCreated={() => setVoyageCommunOpen(false)} />
      )}
      {itineraireOpen && adminId && (
        <CreateItineraireModal userId={adminId} onClose={() => setItineraireOpen(false)} onCreated={() => setItineraireOpen(false)} />
      )}
      {playlistOpen && adminId && (
        <AjouterMusiqueModal userId={adminId} onClose={() => setPlaylistOpen(false)} onCreated={() => setPlaylistOpen(false)} />
      )}
      {gastronomieOpen && adminId && (
        <AjouterPlatModal userId={adminId} onClose={() => setGastronomieOpen(false)} onCreated={() => setGastronomieOpen(false)} />
      )}
      {activitesOpen && adminId && (
        <AjouterLieuModal userId={adminId} onClose={() => setActivitesOpen(false)} onCreated={() => setActivitesOpen(false)} />
      )}
    </div>
  )
}
