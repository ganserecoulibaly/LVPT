import React, { useState } from 'react'
import Sidebar from './Sidebar'
import PageHeader from './PageHeader'
import Footer from './Footer'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY

const PERSONAS = [
  { code: 'JRN', label: 'Journaliste', detail: 'Reportage, interview à l\'étranger' },
  { code: 'SPT', label: 'Sportif', detail: 'Tournoi, stage, compétition' },
  { code: 'CRE', label: 'Créateur de contenu', detail: 'Vidéo, photo, carnet de voyage' },
  { code: 'FRL', label: 'Freelance', detail: 'Mission client sur place' },
  { code: 'CHR', label: 'Chercheur', detail: 'Terrain, colloque international' },
  { code: 'ART', label: 'Artiste', detail: 'Tournée, exposition, résidence' },
  { code: 'ESP', label: 'Joueur e-sport', detail: 'LAN, tournoi international' },
  { code: 'PDC', label: 'Podcasteur', detail: 'Interviews, tournage sur place' },
]

const APPORTS = [
  'Une mention de LVPT dans ta story, ton article ou ta vidéo',
  'Le tag @LeVoyagePourTous pendant la durée du séjour',
  'Un retour honnête sur ton expérience, publié ou non',
]

const RETOURS = [
  'Accès prioritaire à nos offres vols et hébergements',
  'Plan Grand Voyageur offert pendant ta mission',
  'Badge Partenaire visible sur ton profil LVPT',
]

function Stub({ persona }) {
  return (
    <div className="relative shrink-0 w-[168px] bg-white rounded-xl border border-navy/10 overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] font-mono tracking-[0.2em] text-coral">{persona.code}</p>
        <p className="font-serif text-[15px] text-navy mt-1 leading-snug">{persona.label}</p>
      </div>
      <div className="relative h-px">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 4px, rgba(27,42,65,0.18) 4px, rgba(27,42,65,0.18) 8px)' }}
        />
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-cream" />
        <div className="absolute -right-1.5 -top-1.5 w-3 h-3 rounded-full bg-cream" />
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] text-navy/55 leading-snug">{persona.detail}</p>
      </div>
    </div>
  )
}

// Page réservée à l'admin — le lien n'apparaît que pour is_admin dans la
// Sidebar (AdminOnlyNavItem, même logique que /admin-offres). Présente le
// programme de partenariat pro (échange visibilité contre logistique de
// voyage, pas un abonnement) et récolte les candidatures via web3forms,
// même mécanisme que FlightHotelSearch.jsx.
export default function EspacePro() {
  const [form, setForm] = useState({ nom: '', profession: '', reseau: '', deplacement: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `Candidature Espace Pro — ${form.nom}`,
      from_name: 'Le Voyage Pour Tous — Espace Pro',
      type: 'espace_pro',
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
        setForm({ nom: '', profession: '', reseau: '', deplacement: '' })
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-4xl mx-auto">
          <PageHeader />

          {/* ---------- HERO : carte d'embarquement ---------- */}
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center mb-16">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-coral uppercase mb-4">
                Programme partenaires — sur dossier
              </p>
              <h1 className="font-serif text-[36px] sm:text-[44px] leading-[1.1] text-navy">
                Ton prochain voyage,
                <br />
                <em className="not-italic text-coral">en échange d'une histoire.</em>
              </h1>
              <p className="text-navy/65 text-[15px] leading-relaxed mt-6 max-w-md">
                Journaliste en reportage, sportif en compétition, créateur en tournage : si tu pars
                raconter quelque chose à l'étranger, on peut t'aider à organiser le voyage — pas
                contre un abonnement, contre un peu de visibilité.
              </p>
              <a href="#dossier" className="btn-primary inline-flex items-center gap-2 mt-8 text-sm py-3 px-6">
                Déposer mon dossier
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden rotate-[1.2deg]">
                <div className="bg-navy px-6 py-3.5 flex items-center justify-between">
                  <span className="font-mono text-white text-[10px] tracking-[0.25em]">LVPT · CARTE PARTENAIRE</span>
                  <span className="font-mono text-white/50 text-[10px]">N° 0042</span>
                </div>
                <div className="px-6 py-6 grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-[10px] tracking-[0.15em] text-navy/40 uppercase">Passager</p>
                    <p className="font-serif text-navy text-base mt-1">Toi, en mission</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.15em] text-navy/40 uppercase">Statut</p>
                    <p className="font-serif text-coral text-base mt-1">Embarquement ouvert</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.15em] text-navy/40 uppercase">Tu apportes</p>
                    <p className="text-navy/70 text-[13px] mt-1">Visibilité & contenu</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.15em] text-navy/40 uppercase">Tu reçois</p>
                    <p className="text-navy/70 text-[13px] mt-1">Voyage organisé</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-0" style={{ borderTop: '2px dashed rgba(27,42,65,0.15)' }} />
                  <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-cream" />
                  <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-cream" />
                </div>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex gap-[3px] items-end">
                    {[6, 10, 4, 12, 8, 5, 11, 3, 9, 7, 5, 10, 4, 8].map((h, i) => (
                      <div key={i} className="w-[2px] bg-navy/70" style={{ height: `${h * 2}px` }} />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-navy/40">GATE&nbsp;· LVPT</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- PROFILS ---------- */}
          <div className="mb-16">
            <p className="text-[11px] tracking-[0.2em] text-coral uppercase mb-2">Pour qui</p>
            <h2 className="font-serif text-2xl text-navy mb-6 max-w-lg">
              Si tu pars pour une bonne raison, il y a probablement une place pour toi.
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {PERSONAS.map((p) => <Stub key={p.code} persona={p} />)}
            </div>
          </div>

          {/* ---------- ÉCHANGE ---------- */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl overflow-hidden">
