import React, { useState } from 'react'
import AirportAutocomplete from './AirportAutocomplete'

// Clé Web3Forms définie dans le fichier .env (VITE_WEB3FORMS_KEY)
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY

// Calcule la date du jour et J+1 au format AAAA-MM-JJ (format attendu par <input type="date">)
function getDefaultDates() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const format = (d) => d.toISOString().split('T')[0] // -> "2026-06-26"

  return {
    aller: format(today),
    retour: format(tomorrow),
  }
}

const emptyForm = {
  origine: '',
  destination: '',
  aller: getDefaultDates().aller,
  retour: getDefaultDates().retour,
  adultes: 1,
  enfants: 0,
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  newsletter: false,
  budget: '',
  typeHebergement: '',
}

// hideIntro : true quand le formulaire est affiché à un utilisateur déjà
// connecté (ex: depuis "Vols & hébergements") — masque tout l'habillage
// marketing destiné aux visiteurs de la landing page publique.
export default function FlightHotelSearch({ hideIntro = false }) {
  const [mode, setMode] = useState('vols')
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [showModal, setShowModal] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: mode === 'vols'
        ? `Nouvelle recherche de vol — ${form.prenom} ${form.nom}`
        : `Nouvelle recherche d'hébergement — ${form.prenom} ${form.nom}`,
      from_name: 'Le Voyage Pour Tous',
      type: mode,
      ...form,
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setForm(emptyForm)
        setShowModal(true)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section id="recherche" className={`bg-cream ${hideIntro ? '' : 'pt-16 pb-20'}`}>
      <div className={hideIntro ? '' : 'max-w-6xl mx-auto px-6'}>

        {/* Eyebrow + titre marketing — uniquement pour les visiteurs non connectés */}
        {!hideIntro && (
          <div className="text-center mb-10">
            <p className="section-eyebrow">✦ par où commencer ?</p>
            <h2 className="section-title mb-3">
              Et si on cherchait <em className="text-coral not-italic">ton prochain billet</em> ?
            </h2>
            <p className="section-subtitle max-w-md mx-auto">
              Vols et/ou hébergements, on te trouve les meilleures options pour poser ta valise sans te prendre la tête.
            </p>
            <p className="font-sans text-xl font-bold text-coral/70 mt-2">
               100% gratuit, sans inscription
            </p>
          </div>
        )}

        {/* Carte façon polaroïd */}
        <div className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto ${hideIntro ? '' : 'rotate-[-0.4deg]'}`}>

          {/* Toggle vols / hébergements */}
          <div className="flex gap-2 mb-6 bg-cream rounded-full p-1 w-fit mx-auto">
            <button
              type="button"
              onClick={() => setMode('vols')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-sans text-sm font-medium transition-colors ${
                mode === 'vols' ? 'bg-coral text-white' : 'text-navy/60 hover:text-navy'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.7.6-.4 1L6 12l-2 3.5c-.3.5 0 1.1.5 1.3l4 1.5 1.5 4c.2.5.8.8 1.3.5L14 20l4.6 4.6c.4.4 1 .1 1-.4"/>
              </svg>
              Un vol
            </button>
            <button
              type="button"
              onClick={() => setMode('hebergements')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-sans text-sm font-medium transition-colors ${
                mode === 'hebergements' ? 'bg-coral text-white' : 'text-navy/60 hover:text-navy'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/>
              </svg>
              Un toit
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'vols' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <AirportAutocomplete
                  label="Je pars de"
                  placeholder="Paris (CDG)"
                  value={form.origine}
                  onChange={(val) => update('origine', val)}
                />
                <AirportAutocomplete
                  label="Je vais à"
                  placeholder="Hanoï (HAN)"
                  value={form.destination}
                  onChange={(val) => update('destination', val)}
                />
                <Field label="Aller">
                  <input type="date" className="search-input"
                    value={form.aller} onChange={(e) => update('aller', e.target.value)} />
                </Field>
                <Field label="Retour">
                  <input type="date" className="search-input"
                    value={form.retour} onChange={(e) => update('retour', e.target.value)} />
                </Field>
                <Field label="Adultes">
                  <input type="number" min="1" className="search-input"
                    value={form.adultes} onChange={(e) => update('adultes', e.target.value)} />
                </Field>
                <Field label="Enfants">
                  <input type="number" min="0" className="search-input"
                    value={form.enfants} onChange={(e) => update('enfants', e.target.value)} />
                </Field>
                <Field label="Prénom" required>
                  <input type="text" placeholder="Léa" required className="search-input"
                    value={form.prenom} onChange={(e) => update('prenom', e.target.value)} />
                </Field>
                <Field label="Nom" required>
                  <input type="text" placeholder="Martin" required className="search-input"
                    value={form.nom} onChange={(e) => update('nom', e.target.value)} />
                </Field>
                <Field label="Email" required>
                  <input type="email" placeholder="lea.martin@email.com" required className="search-input"
                    value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Téléphone">
                  <input type="tel" placeholder="06 12 34 56 78" className="search-input"
                    value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
                </Field>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Destination">
                  <input type="text" placeholder="Hanoï, Vietnam" className="search-input"
                    value={form.destination} onChange={(e) => update('destination', e.target.value)} />
                </Field>
                <Field label="Adultes">
                  <input type="number" min="1" className="search-input"
                    value={form.adultes} onChange={(e) => update('adultes', e.target.value)} />
                </Field>
                <Field label="Arrivée">
                  <input type="date" className="search-input"
                    value={form.aller} onChange={(e) => update('aller', e.target.value)} />
                </Field>
                <Field label="Départ">
                  <input type="date" className="search-input"
                    value={form.retour} onChange={(e) => update('retour', e.target.value)} />
                </Field>
                <Field label="Enfants">
                  <input type="number" min="0" className="search-input"
                    value={form.enfants} onChange={(e) => update('enfants', e.target.value)} />
                </Field>
                <Field label="Téléphone">
                  <input type="tel" placeholder="06 12 34 56 78" className="search-input"
                    value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
                </Field>
                <Field label="Prénom" required>
                  <input type="text" placeholder="Léa" required className="search-input"
                    value={form.prenom} onChange={(e) => update('prenom', e.target.value)} />
                </Field>
                <Field label="Nom" required>
                  <input type="text" placeholder="Martin" required className="search-input"
                    value={form.nom} onChange={(e) => update('nom', e.target.value)} />
                </Field>
                <Field label="Email" required>
                  <input type="email" placeholder="lea.martin@email.com" required className="search-input"
                    value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Budget max / nuit (€)">
                   <input type="number" min="0" placeholder="ex : 80" className="search-input"
                    value={form.budget} onChange={(e) => update('budget', e.target.value)} />
                </Field>
                <Field label="Type d'hébergement">
                  <select className="search-input" value={form.typeHebergement} onChange={(e) => update('typeHebergement', e.target.value)}>
                    <option value="">Pas de préférence</option>
                    <option value="hotel">Hôtel</option>
                    <option value="auberge">Auberge de jeunesse</option>
                    <option value="airbnb">Airbnb / Location entre particuliers</option>
                    <option value="camping">Camping</option>
                    <option value="guesthouse">Guesthouse / Chambre d'hôtes</option>
                    <option value="glamping">Glamping</option>
                    <option value="resort">Resort / Club</option>
                    <option value="apart-hotel">Apart'hôtel</option>
                    <option value="bateau">Bateau / Péniche</option>
                    <option value="insolite">Hébergement insolite (cabane, igloo…)</option>
                  </select>
                </Field>
              </div>
            )}

            {/* Newsletter — facultative, pour rester aux normes RGPD (consentement libre).
                Inutile côté "Vols & hébergements" : l'utilisateur connecté a déjà fait
                ce choix à l'inscription. */}
            {!hideIntro && (
              <label className="flex items-start gap-3 mt-6 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-coral cursor-pointer"
                  checked={form.newsletter} onChange={(e) => update('newsletter', e.target.checked)} />
                <span className="font-sans text-navy/70 text-sm">
                  Je veux recevoir les bons plans et nouveautés du Voyage Pour Tous par email
                </span>
              </label>
            )}

            <div className="flex justify-center mt-6">
              <SearchButton
                label={mode === 'vols' ? 'Voir les vols' : 'Trouver un toit'}
                sending={status === 'sending'}
              />
            </div>

            {status === 'error' && (
              <p className="font-sans text-coral text-sm text-center mt-4">
                Oups, l'envoi n'a pas fonctionné. Tu peux réessayer ?
              </p>
            )}

            {/* Réassurance marketing — uniquement pour les visiteurs non connectés */}
            {!hideIntro && (
              <p className="font-sans text-navy/40 text-xs text-center mt-6">
                On compare les meilleurs partenaires pour toi — aucune carte bancaire, juste pour repérer le terrain.
              </p>
            )}
          </form>
        </div>

      </div>

      {showModal && (
        <ConfirmationModal onClose={() => setShowModal(false)} />
      )}
    </section>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-sans text-navy/50 text-xs uppercase tracking-wide font-medium">
        {label}{required && <span className="text-coral"> *</span>}
      </label>
      {children}
    </div>
  )
}

function SearchButton({ label, sending }) {
  return (
    <button type="submit" disabled={sending} className="btn-primary justify-center whitespace-nowrap h-fit disabled:opacity-60">
      {sending ? 'Envoi en cours…' : label}
      {!sending && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      )}
    </button>
  )
}

function ConfirmationModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-navy/40 flex items-center justify-center px-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center rotate-[-0.5deg]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-coral/15 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8735a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <p className="font-handwriting text-coral text-lg mb-1">✦ c'est dans la boîte</p>
        <h3 className="font-serif text-navy text-2xl font-medium mb-2">
          Votre demande a été prise en compte
        </h3>
        <p className="font-sans text-navy/60 text-sm mb-6">
          On revient vers toi très vite avec les meilleures options pour ton voyage.
        </p>
        <button onClick={onClose} className="btn-primary justify-center w-full">
          Parfait, merci !
        </button>
      </div>
    </div>
  )
}
