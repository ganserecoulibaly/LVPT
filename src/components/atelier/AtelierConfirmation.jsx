import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Footer from '../Footer'

// TODO : remplace par ton vrai lien Calendly (un seul type d'événement
// générique, utilisé pour tous les ateliers — pas besoin de plan payant
// Calendly). Le widget inline officiel se charge via ce script.
const CALENDLY_URL = 'https://calendly.com/levoyagepourtous/atelier'

export default function AtelierConfirmation() {
  const navigate = useNavigate()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 6" />
            </svg>
            <p className="text-sm text-green-800">
              Paiement confirmé — choisis maintenant ton créneau ci-dessous.
            </p>
          </div>

          <h1 className="font-serif text-2xl text-navy mb-4">Réserve ton créneau</h1>

          <div
            className="calendly-inline-widget rounded-xl overflow-hidden"
            data-url={CALENDLY_URL}
            style={{ minWidth: '320px', height: '650px' }}
          />

          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-navy/50 hover:text-navy transition-colors mt-4"
          >
            Choisir plus tard, retour au Dashboard →
          </button>
        </div>
      </div>

      <div className="ml-0 sm:ml-16">
        <Footer />
      </div>
    </div>
  )
}
