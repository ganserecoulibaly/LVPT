import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { formatDate } from './dateUtils'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import TipBanner from './TipBanner'
import EditProfileModal from './EditProfileModal'
import CreateItineraireModal from './CreateItineraireModal'
import CreateVoyageCommunModal from './CreateVoyageCommunModal'
import QuickAddMenu from './QuickAddMenu'
import Footer from './Footer'
import PricingModal from './PricingModal'
import FavoritesModal from './FavoritesModal'
import ToolboxModal from './ToolboxModal'
import FlightHotelSearch from './FlightHotelSearch'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]

function transformVolsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_vol, type: 'vol',
    title: `${r.aeroport_depart} ➔ ${r.aeroport_arrivee}`,
    price: `${Number(r.prix).toFixed(0)}€`,
    date: `${formatDate(r.date_depart)} → ${formatDate(r.date_arrivee)}`,
    emoji: '✈️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformHebergementsDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_hebergement, type: 'hebergement',
    title: `${r.type_hebergement || 'Hébergement'} à ${r.ville}`,
    price: `${Number(r.prix_nuit).toFixed(0)}€ / nuit`,
    date: `Disponible du ${formatDate(r.date_depart)} au ${formatDate(r.date_arrivee)}`,
    emoji: '🏨', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}
function transformActivitesDeals(rows) {
  return rows.map((r, i) => ({
    id: r.id_activite, type: 'activite', title: r.nom_activite,
    price: r.prix ? `${Number(r.prix).toFixed(0)}€` : 'Gratuit',
    date: r.ville, emoji: '🎟️', fallbackGradient: GRADIENTS[i % GRADIENTS.length], link: r.lien_resa,
  }))
}

function formatDuration(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

const AIRLINE_LOGO_FILENAMES = [
  'Air_France.png',
  'American_Airlines.png',
  'British_Airways.png',
  'Delta.png',
  'Emirates.png',
  'Iberia.png',
  'KLM.png',
  'Lufthansa.png',
  'Qantas.png',
  'Qatar_Airways.png',
  'Ryanair.png',
  'TAP.png',
  'Transavia.png',
  'United_Airlines.png',
]

const AIRLINE_IATA_CODES = {
  'air france': 'AF',
  'ana': 'NH',
  'ryanair': 'FR',
  'vueling': 'VY',
  'emirates': 'EK',
  'turkish airlines': 'TK',
  'klm': 'KL',
  'latam': 'LA',
  'tap': 'TP',
  'qatar airways': 'QR',
  'ita airways': 'AZ',
  'aegean': 'A3',
  'royal air maroc': 'AT',
  'nouvelair': 'BJ',
}

function getAirlineLogoUrl(compagnie) {
  if (!compagnie) return 'https://placehold.co/64x64/EDE8DE/1B2A41?text=%E2%9C%88'

  // Les noms de fichiers utilisent des underscores ("Air_France.png") alors
  // que le nom de compagnie en base a des espaces ("Air France") — sans
  // cette normalisation, .includes() ne matchait jamais les compagnies à
  // nom composé (Air France, American Airlines, Qatar Airways...).
  const target = compagnie.toUpperCase().replace(/\s+/g, '_')
  const localFile = AIRLINE_LOGO_FILENAMES.find((f) => f.toUpperCase().includes(target))
  if (localFile) return `/images/airlines/${localFile}`

  const code = AIRLINE_IATA_CODES[compagnie.toLowerCase()]
  if (code) return `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`

  return 'https://placehold.co/64x64/EDE8DE/1B2A41?text=%E2%9C%88'
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function PaleIcon({ children }) {
  return <span className="text-navy/15">{children}</span>
}
function PlaneOutline() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 2.7 5.9c.3.7 1.2.8 1.7.3l.8-.7c.4-.3.6-.8.5-1.3z" />
    </svg>
  )
}
function BedOutline() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" />
      <path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function RouteTimeline({ from, to, stops, escale }) {
  const stopCodes = escale ? escale.split(',').map((s) => s.trim()).filter(Boolean) : []
  const points = [
    { label: from, big: true },
    ...stopCodes.map((code) => ({ label: code, big: false })),
    { label: to, big: true },
  ]

  return (
    <div className="flex items-start gap-1 my-1.5 overflow-x-auto">
      {points.map((point, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center shrink-0">
            <span className={`rounded-full shrink-0 ${point.big ? 'w-2 h-2 bg-navy/60' : 'w-1.5 h-1.5 border border-navy/40 bg-white'}`} />
            <span className={`mt-1 whitespace-nowrap ${point.big ? 'text-sm font-semibold text-navy' : 'text-[10px] text-navy/45'}`}>
              {point.label}
            </span>
          </div>
          {i < points.length - 1 && <span className="flex-1 h-px bg-navy/20 min-w-[14px] mt-1" />}
        </React.Fragment>
      ))}
      {stops === 0 && (
        <span className="text-[10px] text-navy/35 shrink-0 mt-1">Direct</span>
      )}
    </div>
  )
}

function SelectActions({ selected, groupName, onSelect, onHide }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <input
        type="radio"
        name={groupName}
        checked={selected}
        onChange={onSelect}
        className="w-5 h-5 accent-green-600 cursor-pointer"
        title="Choisir pour mon dashboard"
      />
      <button
        onClick={onHide}
        className="w-7 h-7 rounded-full bg-navy/10 text-navy/50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Supprimer"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function FlightRow({ vol, onSelect, onHide, removing }) {
  const perPerson = Number(vol.prix)
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-all duration-400 ease-in ${
      vol.primary_vol ? 'border-green-600 bg-green-50' : 'border-navy/10 bg-white'
    } ${removing ? 'opacity-0 scale-90 -translate-x-2' : 'opacity-100 scale-100 translate-x-0'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-28 h-16 rounded-md bg-white border border-navy/10 flex items-center justify-center shrink-0 overflow-hidden p-2">
            <img
              src={getAirlineLogoUrl(vol.compagnie)}
              alt={vol.compagnie || 'Compagnie'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {vol.best_flight && (
            <span className="text-[10px] font-semibold text-coral bg-coral/10 px-2 py-0.5 rounded-full shrink-0">
              ★ Best flight
            </span>
          )}
        </div>
        <RouteTimeline from={vol.aeroport_depart} to={vol.aeroport_arrivee} stops={vol.nb_escale} escale={vol.escale} />
        <p className="text-xs text-navy/65 font-medium">
          {formatDate(vol.date_depart)} → {formatDate(vol.date_arrivee)} · {vol.type_trajet}
          {vol.duree_vol ? ` · ${formatDuration(vol.duree_vol)}` : ''}
        </p>
        {vol.lien_resa && (
          <a href={vol.lien_resa} target="_blank" rel="noopener noreferrer" className="text-xs text-coral hover:underline mt-1 inline-block">
            Voir l'offre ↗
          </a>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <div className="text-right">
          <p className="text-2xl font-serif text-coral leading-none">{perPerson.toFixed(0)}€</p>
          {vol.nb_adulte > 1 && (
            <p className="text-[10px] text-navy/40 mt-1">
              {(perPerson * vol.nb_adulte).toFixed(0)}€ total
            </p>
          )}
        </div>
        <SelectActions
          selected={vol.primary_vol}
          groupName="primary-vol-group"
          onSelect={() => onSelect(vol)}
          onHide={() => onHide(vol)}
        />
      </div>
    </div>
  )
}

function VolsSection({ vols, removingIds, onSelect, onHide, onNewSearch, loadError }) {
  return (
    <div className="mb-10">
      <p className="font-serif text-lg text-navy mb-4">
        Vols — {vols.length} résultat{vols.length > 1 ? 's' : ''}
      </p>

      {vols.length === 0 ? (
        <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center flex flex-col items-center gap-4">
          {loadError ? (
            <p className="text-sm text-red-600">Erreur : {loadError}</p>
          ) : (
            <>
              <PaleIcon><PlaneOutline /></PaleIcon>
              <p className="text-sm text-navy/50">Aucun vol proposé pour l'instant.</p>
              <button onClick={onNewSearch} className="btn-primary text-sm py-2.5 px-5">+ nouvelle recherche</button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {vols.map((vol) => (
            <FlightRow
              key={vol.id_vol}
              vol={vol}
              onSelect={onSelect}
              onHide={onHide}
              removing={removingIds.has(vol.id_vol)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StayRow({ heb, onSelect, onHide, removing, nights }) {
  const pricePerNight = Number(heb.prix_nuit)
  const total = pricePerNight * nights
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-all duration-400 ease-in ${
      heb.primary_hebergement ? 'border-green-600 bg-green-50' : 'border-navy/10 bg-white'
    } ${removing ? 'opacity-0 scale-90 -translate-x-2' : 'opacity-100 scale-100 translate-x-0'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy">{heb.type_hebergement || 'Hébergement'} — {heb.ville}</p>
        <p className="text-xs text-navy/55 mt-0.5">
          {heb.quartier ? `${heb.quartier} · ` : ''}{formatDate(heb.date_depart)} → {formatDate(heb.date_arrivee)}
        </p>
        {heb.lien_resa && (
          <a href={heb.lien_resa} target="_blank" rel="noopener noreferrer" className="text-xs text-coral hover:underline mt-1 inline-block">
            Voir l'offre ↗
          </a>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <div className="text-right">
          <p className="text-2xl font-serif text-coral leading-none">{pricePerNight.toFixed(0)}€</p>
          <p className="text-[10px] text-navy/40 mt-1">
            × {nights} nuit{nights > 1 ? 's' : ''} = {total.toFixed(0)}€
          </p>
        </div>
        <SelectActions
          selected={heb.primary_hebergement}
          groupName="primary-hebergement-group"
          onSelect={() => onSelect(heb)}
          onHide={() => onHide(heb)}
        />
      </div>
    </div>
  )
}

function HebergementsSection({ stays, removingIds, onSelect, onHide, onNewSearch, loadError, nights, setNights }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-serif text-lg text-navy">
          Hébergements — {stays.length} résultat{stays.length > 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2 text-xs text-navy/55">
          <span>Nombre de nuits</span>
          <button
            onClick={() => setNights((n) => Math.max(1, n - 1))}
            className="w-6 h-6 rounded-full border border-navy/15 flex items-center justify-center hover:bg-navy/5 transition-colors"
          >
            −
          </button>
          <span className="w-5 text-center font-medium text-navy">{nights}</span>
          <button
            onClick={() => setNights((n) => n + 1)}
            className="w-6 h-6 rounded-full border border-navy/15 flex items-center justify-center hover:bg-navy/5 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {stays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-navy/15 bg-white p-10 text-center flex flex-col items-center gap-4">
          {loadError ? (
            <p className="text-sm text-red-600">Erreur : {loadError}</p>
          ) : (
            <>
              <PaleIcon><BedOutline /></PaleIcon>
              <p className="text-sm text-navy/50">Aucun hébergement proposé pour l'instant.</p>
              <button onClick={onNewSearch} className="btn-primary text-sm py-2.5 px-5">+ nouvelle recherche</button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stays.map((heb) => (
            <StayRow
              key={heb.id_hebergement}
              heb={heb}
              onSelect={onSelect}
              onHide={onHide}
              removing={removingIds.has(heb.id_hebergement)}
              nights={nights}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const COMMUNITY_NOTES = [
  { initials: 'LD', color: 'bg-[#F0997B]', name: 'Léa', text: "a payé son vol direct 580 € en réservant 2 mois avant.", time: 'il y a 6 jours' },
  { initials: 'YK', color: 'bg-[#4A6FA5]', name: 'Yanis', text: "recommande d'éviter les vols avec escale à Doha en été.", time: 'il y a 2 semaines' },
]

function CommunityNotes() {
  return (
    <div className="rounded-xl bg-white border border-navy/10 p-5 mb-5">
      <p className="font-serif text-base text-navy mb-4">Ce que d'autres voyageurs ont noté</p>
      <div className="flex flex-col gap-4">
        {COMMUNITY_NOTES.map((n, i) => (
          <div key={i} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full ${n.color} text-white text-xs font-medium flex items-center justify-center shrink-0`}>
              {n.initials}
            </div>
            <div>
              <p className="text-sm text-navy"><span className="font-medium">{n.name}</span> {n.text}</p>
              <p className="text-xs text-navy/40 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetSummary({ vols, stays, nights }) {
  const primaryVol = vols.find((v) => v.primary_vol)
  const primaryStay = stays.find((s) => s.primary_hebergement)
  if (!primaryVol && !primaryStay) return null

  const volPrice = primaryVol ? Number(primaryVol.prix) : 0
  const stayTotal = primaryStay ? Number(primaryStay.prix_nuit) * nights : 0
  const total = volPrice + stayTotal

  return (
    <div className="lg:sticky lg:top-6 rounded-xl bg-coral/5 border border-coral/20 p-5">
      <p className="font-serif text-base text-navy mb-3">Budget</p>
      {primaryVol && (
        <div className="flex justify-between text-sm text-navy mb-2">
          <span>✓ vol {primaryVol.compagnie || `${primaryVol.aeroport_depart} → ${primaryVol.aeroport_arrivee}`}</span>
          <span className="font-medium">{volPrice.toFixed(0)}€</span>
        </div>
      )}
      {primaryStay && (
        <div className="flex justify-between text-sm text-navy mb-2">
          <span>✓ {primaryStay.type_hebergement || 'hébergement'} ({nights} nuit{nights > 1 ? 's' : ''})</span>
          <span className="font-medium">{stayTotal.toFixed(0)}€</span>
        </div>
      )}
      <div className="border-t border-coral/20 mt-3 pt-3 flex justify-between text-sm font-semibold text-navy">
        <span>Total</span>
        <span>{total.toFixed(0)}€</span>
      </div>
    </div>
  )
}

export default function VolsHebergements() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxTab, setToolboxTab] = useState('currency')
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickCreateItineraireOpen, setQuickCreateItineraireOpen] = useState(false)
  const [quickCreateVoyageCommunOpen, setQuickCreateVoyageCommunOpen] = useState(false)

  const [flightDeals, setFlightDeals] = useState([])
  const [hotelDeals, setHotelDeals] = useState([])
  const [activityDeals, setActivityDeals] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  const [vols, setVols] = useState([])
  const [volsError, setVolsError] = useState(null)
  const [stays, setStays] = useState([])
  const [staysError, setStaysError] = useState(null)
  const [nights, setNights] = useState(1)

  const [removingIds, setRemovingIds] = useState(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (!user) return

    async function loadFavoritesData() {
      const [{ data: d }, { data: h }, { data: a }, { data: f }] = await Promise.all([
        supabase.from('d_vol').select('*'),
        supabase.from('d_hebergement').select('*'),
        supabase.from('d_activite').select('*'),
        supabase.from('favoris').select('id_entite, nom').eq('actif', true),
      ])
      setFlightDeals(transformVolsDeals(d || []))
      setHotelDeals(transformHebergementsDeals(h || []))
      setActivityDeals(transformActivitesDeals(a || []))
      setFavoriteIds(new Set((f || []).map((x) => `${x.nom}:${x.id_entite}`)))
    }

    async function loadVols() {
      const { data, error } = await supabase
        .from('s_vol').select('*').eq('pid', user.id).neq('statut', 'refus').order('prix', { ascending: true })
      if (error) setVolsError(error.message)
      setVols(data || [])
    }

    async function loadStays() {
      const { data, error } = await supabase
        .from('s_hebergement').select('*').eq('pid', user.id).neq('statut', 'refus').order('prix_nuit', { ascending: true })
      if (error) setStaysError(error.message)
      setStays(data || [])
    }

    loadFavoritesData()
    loadVols()
    loadStays()
  }, [user])

  const toggleFavorite = async (deal) => {
    const key = `${deal.type}:${deal.id}`
    const isCurrentlyFavorite = favoriteIds.has(key)
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (isCurrentlyFavorite) next.delete(key)
      else next.add(key)
      return next
    })
    await supabase.from('favoris').upsert(
      { pid: user.id, id_entite: deal.id, nom: deal.type, actif: !isCurrentlyFavorite },
      { onConflict: 'pid,id_entite,nom' }
    )
  }

  const handleSelectVol = async (vol) => {
    setVols((current) => current.map((v) => ({ ...v, primary_vol: v.id_vol === vol.id_vol })))
    await supabase.from('s_vol').update({ primary_vol: true }).eq('id_vol', vol.id_vol)
  }
  const handleSelectStay = async (heb) => {
    setStays((current) => current.map((h) => ({ ...h, primary_hebergement: h.id_hebergement === heb.id_hebergement })))
    await supabase.from('s_hebergement').update({ primary_hebergement: true }).eq('id_hebergement', heb.id_hebergement)
  }

  function scheduleRemoval(type, item) {
    const idKey = type === 'vol' ? item.id_vol : item.id_hebergement
    setRemovingIds((s) => new Set(s).add(idKey))

    setTimeout(async () => {
      if (type === 'vol') setVols((c) => c.filter((v) => v.id_vol !== idKey))
      else setStays((c) => c.filter((s) => s.id_hebergement !== idKey))

      setRemovingIds((s) => {
        const next = new Set(s)
        next.delete(idKey)
        return next
      })

      if (type === 'vol') await supabase.from('s_vol').update({ statut: 'refus' }).eq('id_vol', idKey)
      else await supabase.from('s_hebergement').update({ statut: 'refus' }).eq('id_hebergement', idKey)
    }, 400)
  }

  const ALL_DEALS = [...flightDeals, ...hotelDeals, ...activityDeals]
  const favoriteDeals = ALL_DEALS.filter((deal) => favoriteIds.has(`${deal.type}:${deal.id}`))

  if (!user) return null

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col">
        <Sidebar
          onLockedClick={() => setPricingOpen(true)}
          onToolboxClick={(tab) => { setToolboxTab(tab); setToolboxOpen(true) }}
        />

        <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
          <div className="max-w-6xl mx-auto">
            <PageHeader
              onFavoritesClick={() => setFavoritesOpen(true)}
              onUpgradeClick={() => setPricingOpen(true)}
              onProfileClick={() => setProfileOpen(true)}
            />

            <div className="mb-6">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="font-serif text-3xl text-navy">Vols & hébergements</h1>
                <QuickAddMenu
                  open={quickAddOpen}
                  onToggle={() => setQuickAddOpen((o) => !o)}
                  onClose={() => setQuickAddOpen(false)}
                  onCreateItineraire={() => { setQuickAddOpen(false); setQuickCreateItineraireOpen(true) }}
                  onCreateVoyageCommun={() => { setQuickAddOpen(false); setQuickCreateVoyageCommunOpen(true) }}
                  onSearchFlights={() => { setQuickAddOpen(false); setSearchOpen(true) }}
                />
              </div>
              <p className="text-navy/70 text-center sm:text-left">
                Retrouve ici toutes tes propositions, et choisis celles qui comptent pour ton dashboard.
              </p>
            </div>

            <TipBanner nomPage="vols-hebergements" />

            <div className="mb-6 px-4 py-3.5 rounded-xl bg-white border border-navy/10">
              <p className="text-xs font-medium text-navy/70 mb-2.5">Comment ça marche ?</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-navy/55">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                  </span>
                  <span>Choisis cette offre : elle deviendra celle affichée sur ton dashboard (une seule à la fois).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy/10 text-navy/50 flex items-center justify-center shrink-0 mt-0.5">
                    <TrashIcon />
                  </span>
                  <span>Retire cette offre : elle sera retirée de la liste et ne réapparaîtra plus.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <VolsSection
                  vols={vols}
                  removingIds={removingIds}
                  onSelect={handleSelectVol}
                  onHide={(vol) => scheduleRemoval('vol', vol)}
                  onNewSearch={() => setSearchOpen(true)}
                  loadError={volsError}
                />
                <HebergementsSection
                  stays={stays}
                  removingIds={removingIds}
                  onSelect={handleSelectStay}
                  onHide={(heb) => scheduleRemoval('hebergement', heb)}
                  onNewSearch={() => setSearchOpen(true)}
                  loadError={staysError}
                  nights={nights}
                  setNights={setNights}
                />
              </div>

              <div className="lg:col-span-1">
                <CommunityNotes />
                <BudgetSummary vols={vols} stays={stays} nights={nights} />
              </div>
            </div>
          </div>
        </div>

        <div className="ml-0 sm:ml-16">
          <Footer />
        </div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
      {favoritesOpen && (
        <FavoritesModal
          onClose={() => setFavoritesOpen(false)}
          favoriteDeals={favoriteDeals}
          userId={user.id}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}
      {toolboxOpen && <ToolboxModal onClose={() => setToolboxOpen(false)} initialTab={toolboxTab} />}

      {profileOpen && <EditProfileModal userId={user.id} onClose={() => setProfileOpen(false)} />}

      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ height: 'fit-content' }}
            className="bg-cream rounded-2xl p-6 sm:p-8 w-full max-w-3xl relative m-auto"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors z-10"
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <FlightHotelSearch hideIntro />
          </div>
        </div>
      )}

      {quickCreateItineraireOpen && (
        <CreateItineraireModal
          userId={user.id}
          onClose={() => setQuickCreateItineraireOpen(false)}
          onCreated={() => { setQuickCreateItineraireOpen(false); navigate('/itineraires') }}
        />
      )}

      {quickCreateVoyageCommunOpen && (
        <CreateVoyageCommunModal
          userId={user.id}
          onClose={() => setQuickCreateVoyageCommunOpen(false)}
          onCreated={() => { setQuickCreateVoyageCommunOpen(false); navigate('/voyage-commun') }}
        />
      )}

    </>
  )
}
