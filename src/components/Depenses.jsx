import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import EditProfileModal from './EditProfileModal'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import Footer from './Footer'
import { usePlanAccess } from './usePlanAccess'
import { useFavoriLieuxEtPlats } from './useFavoriLieuxEtPlats'
import PlanLockedScreen from './PlanLockedScreen'

// Même source que le convertisseur de devises de la Boîte à outils
// (ToolboxModal.jsx) — cohérence sur toute l'app, un seul mécanisme
// à maintenir. Gratuite, sans clé, avec repli si le CDN principal
// est indisponible.
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
// Triées par libellé (pays/devise), pas par code.
const COMMON_CURRENCIES = Object.entries(CURRENCY_LABELS)
  .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
  .map(([code]) => code)

const CATEGORIES = [
  'Vol', 'Train', 'Bus / Car', 'Voiture', 'Hébergement', 'Restaurant',
  'Visites / Activités', 'Transport local', 'Souvenirs / Shopping',
  'Visa', 'Assurance voyage', 'Autre',
]

const CATEGORY_ICONS = {
  'Vol': 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  'Train': 'M4 3h16v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V3zM4 11h16M8 21l-2 2M16 21l2 2M7.5 15.5h.01M16.5 15.5h.01',
  'Bus / Car': 'M4 17h16M6 17v2M18 17v2M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9H4V6zM4 11h16',
  'Voiture': 'M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 12l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5H3v-5z',
  'Hébergement': 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9',
  'Restaurant': 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
  'Visites / Activités': 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01',
  'Transport local': 'M8 6v12M16 6v12M2 12h20M4 6h16v12H4z',
  'Souvenirs / Shopping': 'M6 2l3 6h6l3-6M2 8h20l-2 12H4L2 8zM10 12a2 2 0 0 0 4 0',
  'Visa': 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4 18c1-2 3-3 5-3s4 1 5 3M15 8h4M15 12h4',
  'Assurance voyage': 'M12 2 3 6v6c0 5 4 8 9 10 5-2 9-5 9-10V6l-9-4zM12 8v6M9 11h6',
  'Autre': 'M12 2 3 6v6c0 5 4 8 9 10 5-2 9-5 9-10V6l-9-4z',
}

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

function DepenseRow({ d, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-navy/5 last:border-0 group">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={CATEGORY_ICONS[d.categorie] || CATEGORY_ICONS['Autre']} />
          </svg>
        </div>
        <div>
          <p className="text-sm text-navy">{d.intitule}</p>
          <p className="text-[11px] text-navy/40">{d.categorie} · {new Date(d.date_depense).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-navy">
          {Number(d.montant_eur).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
          {d.devise !== 'EUR' && (
            <span className="text-navy/40 font-normal"> ({Number(d.montant).toLocaleString('fr-FR')} {d.devise})</span>
          )}
        </p>
        {onDelete && (
          <button onClick={() => onDelete(d.id_depense)} className="opacity-0 group-hover:opacity-100 text-navy/30 hover:text-red-500 transition-all" aria-label="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function Depenses() {
  const { user, allowed } = usePlanAccess('occasional')
  const { favoriLieuxEtPlats, toggleFavoriGeneric } = useFavoriLieuxEtPlats(user)
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
  const [categorie, setCategorie] = useState(CATEGORIES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [voyagesCommunaute, setVoyagesCommunaute] = useState([])
  const [destinationsConnues, setDestinationsConnues] = useState([])
  const [searchVille, setSearchVille] = useState('')
  const [searchPays, setSearchPays] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [expandedVoyageId, setExpandedVoyageId] = useState(null)
  const [expandedCommunauteId, setExpandedCommunauteId] = useState(null)

  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')

  const loadVoyages = () => {
    if (!user) return
    supabase.from('s_voyage').select('*').eq('pid', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setVoyages(data || []))
  }

  const loadDepenses = () => {
    if (!user) return
    supabase.from('s_depense').select('*').eq('pid', user.id).order('date_depense', { ascending: false })
      .then(({ data }) => setDepenses(data || []))
  }

  useEffect(() => { loadVoyages(); loadDepenses() }, [user])

  useEffect(() => {
    supabase.rpc('get_destinations_disponibles').then(({ data }) => setDestinationsConnues(data || []))
  }, [])

  const villesConnues = useMemo(
    () => [...new Set(destinationsConnues.map((d) => d.destination_ville))].sort(),
    [destinationsConnues]
  )
  const paysConnus = useMemo(
    () => [...new Set(destinationsConnues.map((d) => d.destination_pays))].sort(),
    [destinationsConnues]
  )
  // Villes filtrées par le pays sélectionné — recherche (select strict).
  const villesPourRecherche = useMemo(() => {
    if (!searchPays) return villesConnues
    return [...new Set(destinationsConnues.filter((d) => d.destination_pays === searchPays).map((d) => d.destination_ville))].sort()
  }, [destinationsConnues, searchPays, villesConnues])
  // Villes filtrées par le pays tapé — création de voyage (texte libre +
  // suggestions), ne bloque jamais la saisie d'un pays inédit.
  const villesPourNouveauVoyage = useMemo(() => {
    if (!newPays.trim()) return villesConnues
    const match = destinationsConnues.filter((d) => d.destination_pays.toLowerCase() === newPays.trim().toLowerCase())
    return match.length > 0 ? [...new Set(match.map((d) => d.destination_ville))].sort() : villesConnues
  }, [destinationsConnues, newPays, villesConnues])

  // Un seul voyage "ouvert" à la fois — celui pas encore clôturé.
  // Les voyages clôturés passent automatiquement en "précédents".
  const currentVoyage = voyages.find((v) => !v.cloture) || null
  // Limité aux 5 plus récents — pour l'historique complet ou celui des
  // autres, la recherche communautaire fait déjà le travail.
  const pastVoyages = voyages.filter((v) => v.cloture).slice(0, 5)

  const depensesCourantes = useMemo(
    () => depenses.filter((d) => d.id_voyage === currentVoyage?.id_voyage),
    [depenses, currentVoyage]
  )

  const totalEur = useMemo(() => depensesCourantes.reduce((s, d) => s + Number(d.montant_eur), 0), [depensesCourantes])

  const parCategorie = useMemo(() => {
    const map = {}
    depensesCourantes.forEach((d) => { map[d.categorie] = (map[d.categorie] || 0) + Number(d.montant_eur) })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [depensesCourantes])

  const maxCategorie = parCategorie.length > 0 ? parCategorie[0][1] : 1

  const totalParVoyage = (idVoyage) =>
    depenses.filter((d) => d.id_voyage === idVoyage).reduce((s, d) => s + Number(d.montant_eur), 0)

  // Voyages d'autres users sur la destination recherchée — jamais de
  // pid ni de prénom dans la réponse (voir la fonction SQL), on
  // regroupe juste les lignes plates par id_voyage pour reconstituer
  // chaque voyage. Déclenché manuellement, pas automatique. Résultats
  // affichés en liste compacte — le détail ne s'ouvre qu'au clic.
  const handleSearchCommunaute = async () => {
    if (!searchVille.trim() && !searchPays.trim()) return
    setSearchLoading(true)
    setSearchDone(false)
    setExpandedCommunauteId(null)
    const { data } = await supabase.rpc('get_voyages_communaute', {
      p_ville: searchVille.trim(),
      p_pays: searchPays.trim(),
    })
    const parVoyage = {}
    ;(data || []).forEach((row) => {
      if (!parVoyage[row.id_voyage]) {
        parVoyage[row.id_voyage] = {
          id_voyage: row.id_voyage,
          destination_ville: row.destination_ville,
          destination_pays: row.destination_pays,
          duree_jours: row.duree_jours,
          total: 0,
          depenses: [],
        }
      }
      parVoyage[row.id_voyage].total += Number(row.montant_eur)
      parVoyage[row.id_voyage].depenses.push({
        id_depense: row.id_depense,
        intitule: row.intitule,
        categorie: row.categorie,
        montant: row.montant,
        devise: row.devise,
        montant_eur: row.montant_eur,
        date_depense: row.date_depense,
      })
    })
    setVoyagesCommunaute(Object.values(parVoyage))
    setSearchLoading(false)
    setSearchDone(true)
  }

  const handleEndVoyage = async () => {
    if (!currentVoyage) return
    const { data, error } = await supabase
      .from('s_voyage')
      .update({ cloture: true })
      .eq('id_voyage', currentVoyage.id_voyage)
      .select()
    if (error || !data || data.length === 0) {
      alert('Impossible de clôturer ce voyage — vérifie que la policy "s_voyage_update_own" existe bien en base (voir lvpt_depenses_create.sql).')
      return
    }
    loadVoyages()
  }

  // Title Case ("marseille" -> "Marseille") plutôt qu'un vrai tout-en-
  // majuscules — évite que la casse tapée par l'utilisateur crée deux
  // destinations distinctes ("Marseille" vs "marseille") dans les
  // suggestions et la recherche.
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
      pid: user.id,
      destination_ville: normaliserCasse(newVille),
      destination_pays: normaliserCasse(newPays),
      duree_jours: Number(newDuree),
    })
    setCreatingVoyage(false)
    if (insertError) {
      setVoyageError('Impossible de créer ce voyage pour le moment.')
      return
    }
    setNewVille('')
    setNewPays('')
    setNewDuree('')
    loadVoyages()
    supabase.rpc('get_destinations_disponibles').then(({ data }) => setDestinationsConnues(data || []))
  }

  const handleAdd = async () => {
    if (!currentVoyage) {
      setError('Renseigne d\'abord ton voyage (destination + durée) ci-dessus.')
      return
    }
    if (!intitule.trim() || !montant || Number(montant) <= 0) {
      setError('Renseigne un intitulé et un montant valide.')
      return
    }
    setSaving(true)
    setError(null)

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
        pid: user.id,
        id_voyage: currentVoyage.id_voyage,
        intitule: intitule.trim(),
        categorie,
        montant: Number(montant),
        devise,
        montant_eur: montantEur,
        taux_conversion: taux,
      })

      if (insertError) throw insertError

      setIntitule('')
      setMontant('')
      loadDepenses()
    } catch (err) {
      setError(err.message || 'Impossible d\'ajouter la dépense pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('s_depense').delete().eq('id_depense', id)
    loadDepenses()
  }

  if (!user || allowed === null) return null

  if (!allowed) {
    return (
      <PlanLockedScreen
        title="Journal de dépenses"
        requiredPlan="occasional"
        pricingOpen={pricingOpen}
        onPricingOpen={() => setPricingOpen(true)}
        onPricingClose={() => setPricingOpen(false)}
        onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
      />
    )
  }

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="font-serif text-3xl text-navy mb-1">Journal de dépenses</h1>
                {currentVoyage ? (
                  <p className="text-navy/70">
                    {currentVoyage.destination_ville}, {currentVoyage.destination_pays} · {currentVoyage.duree_jours} jour{currentVoyage.duree_jours > 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-navy/70">Suis tes dépenses par catégorie, tout au long de ton voyage.</p>
                )}
              </div>
              {currentVoyage && (
                <button
                  onClick={handleEndVoyage}
                  className="text-xs text-navy/60 border border-navy/15 rounded-full px-3 py-1.5 hover:bg-navy/5 transition-colors shrink-0 whitespace-nowrap"
                >
                  Terminer le voyage
                </button>
              )}
            </div>

            {/* Recherche communautaire — indépendante du voyage en cours,
                utilisable même sans avoir encore créé son propre voyage.
                Remontée en haut de page, avant tout le reste. */}
            <div className="bg-white border border-navy/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-navy/40 uppercase tracking-wide mb-1">Dépenses d'autres voyageurs</p>
              <p className="text-[11px] text-navy/40 mb-3">Recherche par pays et/ou ville.</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select
                  value={searchPays}
                  onChange={(e) => { setSearchPays(e.target.value); setSearchVille('') }}
                  className="flex-1 px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral"
                >
                  <option value="">Tous les pays</option>
                  {paysConnus.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={searchVille}
                  onChange={(e) => setSearchVille(e.target.value)}
                  className="flex-1 px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral"
                >
                  <option value="">Toutes les villes</option>
                  {villesPourRecherche.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={handleSearchCommunaute} disabled={searchLoading} className="btn-primary text-sm py-2 px-5 disabled:opacity-60 shrink-0">
                  {searchLoading ? 'Recherche…' : 'Rechercher'}
                </button>
              </div>

              {searchDone && voyagesCommunaute.length === 0 && (
                <p className="text-sm text-navy/40 py-4 text-center">Aucun voyage trouvé pour cette destination.</p>
              )}

              {voyagesCommunaute.length > 0 && (
                <div className="flex flex-col gap-2">
                  {voyagesCommunaute.map((v) => {
                    const isOpen = expandedCommunauteId === v.id_voyage
                    return (
                      <div key={v.id_voyage} className="border border-navy/5 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedCommunauteId(isOpen ? null : v.id_voyage)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-navy/5 transition-colors"
                        >
                          <div>
                            <p className="text-sm text-navy font-medium">{v.destination_ville}, {v.destination_pays}</p>
                            <p className="text-[11px] text-navy/40">{v.duree_jours} jour{v.duree_jours > 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-navy">{v.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-navy/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-1 border-t border-navy/5 pt-1">
                            {v.depenses.map((d) => <DepenseRow key={d.id_depense} d={d} />)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {!currentVoyage && (
              <div className="bg-white border border-navy/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Ton voyage</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text" placeholder="Pays (ex : Maroc)" list="pays-connus"
                    value={newPays} onChange={(e) => setNewPays(e.target.value)}
                    className="px-3 py-2 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
                  />
                  <input
                    type="text" placeholder="Ville (ex : Marrakech)" list="villes-nouveau-voyage"
                    value={newVille} onChange={(e) => setNewVille(e.target.value)}
                    className="px-3 py-2 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
                  />
                  <input
                    type="number" min="1" placeholder="Durée (jours)"
                    value={newDuree} onChange={(e) => setNewDuree(e.target.value)}
                    className="px-3 py-2 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
                  />
                </div>
                <datalist id="pays-connus">
                  {paysConnus.map((p) => <option key={p} value={p} />)}
                </datalist>
                <datalist id="villes-nouveau-voyage">
                  {villesPourNouveauVoyage.map((v) => <option key={v} value={v} />)}
                </datalist>
                {voyageError && <p className="text-xs text-red-600 mb-2">{voyageError}</p>}
                <button onClick={handleCreateVoyage} disabled={creatingVoyage} className="btn-primary text-sm py-2 px-5 disabled:opacity-60">
                  {creatingVoyage ? 'Création…' : 'Commencer ce voyage'}
                </button>
              </div>
            )}

            {currentVoyage && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border border-navy/10 rounded-xl p-4">
                    <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">
                      Répartition — {depensesCourantes.length} dépense{depensesCourantes.length > 1 ? 's' : ''}, {totalEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
                    </p>
                    {parCategorie.length === 0 ? (
                      <p className="text-sm text-navy/40 py-4 text-center">Aucune dépense enregistrée pour l'instant.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {parCategorie.map(([cat, total]) => (
                          <div key={cat}>
                            <div className="flex justify-between text-xs text-navy/70 mb-1">
                              <span>{cat}</span>
                              <span>{total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                            </div>
                            <div className="bg-navy/5 h-1.5 rounded-full">
                              <div className="bg-coral h-1.5 rounded-full" style={{ width: `${Math.max(4, (total / maxCategorie) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-navy/10 rounded-xl p-4">
                    <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Nouvelle dépense</p>
                    <input
                      type="text" placeholder="Intitulé (ex : Dîner à Rome)"
                      value={intitule} onChange={(e) => setIntitule(e.target.value)}
                      className="w-full px-3 py-2 border border-navy/15 rounded-lg text-sm mb-2 focus:outline-none focus:border-coral"
                    />
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number" min="0" step="0.01" placeholder="Montant"
                        value={montant} onChange={(e) => setMontant(e.target.value)}
                        className="flex-1 px-3 py-2 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral"
                      />
                      <select value={devise} onChange={(e) => setDevise(e.target.value)} className="w-24 px-2 py-2 border border-navy/15 rounded-lg text-sm bg-white focus:outline-none focus:border-coral">
                        {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c} — {CURRENCY_LABELS[c]}</option>)}
                      </select>
                    </div>
                    <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full px-3 py-2 border border-navy/15 rounded-lg text-sm bg-white mb-2 focus:outline-none focus:border-coral">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
                    <button onClick={handleAdd} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-60">
                      {saving ? 'Ajout…' : '+ Ajouter'}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-navy/10 rounded-xl p-4 mb-6">
                  <p className="text-xs text-navy/40 uppercase tracking-wide mb-3">Dépenses récentes</p>
                  {depensesCourantes.length === 0 ? (
                    <p className="text-sm text-navy/40 py-4 text-center">Rien pour l'instant — ajoute ta première dépense.</p>
                  ) : (
                    <div className="flex flex-col">
                      {depensesCourantes.map((d) => <DepenseRow key={d.id_depense} d={d} onDelete={handleDelete} />)}
                    </div>
                  )}
                </div>
              </>
            )}

            {pastVoyages.length > 0 && (
              <div>
                <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Voyages précédents</p>
                <div className="flex flex-col gap-2">
                  {pastVoyages.map((v) => (
                    <div key={v.id_voyage} className="bg-white border border-navy/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedVoyageId(expandedVoyageId === v.id_voyage ? null : v.id_voyage)}
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-navy/5 transition-colors"
                      >
                        <div>
                          <p className="text-sm text-navy font-medium">{v.destination_ville}, {v.destination_pays}</p>
                          <p className="text-[11px] text-navy/40">{v.duree_jours} jour{v.duree_jours > 1 ? 's' : ''} · {new Date(v.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-navy">{totalParVoyage(v.id_voyage).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-navy/40 transition-transform ${expandedVoyageId === v.id_voyage ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </button>
                      {expandedVoyageId === v.id_voyage && (
                        <div className="px-3.5 pb-3.5 border-t border-navy/5 pt-2">
                          {depenses.filter((d) => d.id_voyage === v.id_voyage).map((d) => (
                            <DepenseRow key={d.id_depense} d={d} onDelete={handleDelete} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal onClose={() => setFavoritesOpen(false)} favoriteDeals={favoriLieuxEtPlats} userId={user.id} favoriteIds={new Set(favoriLieuxEtPlats.map((d) => `${d.type}:${d.id}`))} onToggleFavorite={toggleFavoriGeneric} />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}
      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}
    </>
  )
}
