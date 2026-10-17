import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Sidebar from '../Sidebar'
import Footer from '../Footer'

const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js'

// Page d'arrivée après le paiement Stripe (?session_id=...).
// 1. attend que le webhook ait marqué la réservation comme payée ;
// 2. affiche le calendrier Calendly de l'atelier (nom/e-mail préremplis) ;
// 3. quand la date est choisie, prévient le serveur (enregistrement + ntfy)
//    puis ramène sur le Dashboard.
export default function AtelierConfirmation() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  // 'loading' | 'waiting' (paiement en cours de validation) | 'ready' | 'error'
  const [status, setStatus] = useState('loading')
  const [atelier, setAtelier] = useState(null)
  const [user, setUser] = useState(null)
  const [dateDone, setDateDone] = useState(false)
  const widgetRef = useRef(null)
  const sentRef = useRef(false)

  // Réservation payée ? (le webhook peut avoir quelques secondes de retard)
  useEffect(() => {
    if (!sessionId) { setStatus('error'); return undefined }
    let cancelled = false
    let tries = 0

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setUser(session?.user ?? null)

      const { data } = await supabase
        .from('s_atelier_reservation')
        .select('statut_paiement, date_choisie_le, id_atelier')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()
      if (cancelled) return

      if (data?.statut_paiement === 'paye') {
        const { data: at } = await supabase
          .from('d_atelier')
          .select('titre, calendly_url')
          .eq('id_atelier', data.id_atelier)
          .maybeSingle()
        if (cancelled) return
        setAtelier(at || null)
        setDateDone(Boolean(data.date_choisie_le))
        setStatus('ready')
        return
      }

      tries += 1
      if (tries > 20) { setStatus('error'); return }
      setStatus('waiting')
      setTimeout(check, 1500)
    }

    check()
    return () => { cancelled = true }
  }, [sessionId])

  // Calendrier Calendly + écoute de la réservation d'une date
  useEffect(() => {
    if (status !== 'ready' || dateDone || !atelier?.calendly_url || !widgetRef.current) return undefined

    function onMessage(e) {
      if (e.origin !== 'https://calendly.com') return
      if (e.data?.event !== 'calendly.event_scheduled' || sentRef.current) return
      sentRef.current = true
      const eventUri = e.data?.payload?.event?.uri || null
      supabase.functions
        .invoke('atelier-date-choisie', { body: { sessionId, eventUri } })
        .catch((err) => console.error('Enregistrement de la date :', err))
        .finally(() => setDateDone(true))
    }
    window.addEventListener('message', onMessage)

    function mount() {
      if (!window.Calendly || !widgetRef.current) return
      widgetRef.current.innerHTML = ''
      const meta = user?.user_metadata || {}
      window.Calendly.initInlineWidget({
        url: atelier.calendly_url,
        parentElement: widgetRef.current,
        prefill: {
          name: meta.full_name || meta.name || '',
          email: user?.email || '',
        },
      })
    }

    let script = document.querySelector(`script[src="${CALENDLY_SCRIPT}"]`)
    if (window.Calendly) {
      mount()
    } else {
      if (!script) {
        script = document.createElement('script')
        script.src = CALENDLY_SCRIPT
        script.async = true
        document.body.appendChild(script)
      }
      script.addEventListener('load', mount)
    }

    return () => {
      window.removeEventListener('message', onMessage)
      script?.removeEventListener('load', mount)
    }
  }, [status, dateDone, atelier, sessionId, user])

  // Date choisie : bref message puis retour au Dashboard
  useEffect(() => {
    if (!dateDone) return undefined
    const t = setTimeout(() => navigate('/dashboard'), 3000)
    return () => clearTimeout(t)
  }, [dateDone, navigate])

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-2xl mx-auto">
          {(status === 'loading' || status === 'waiting') && (
            <div className="bg-white border border-navy/10 rounded-xl px-4 py-6 text-center">
              <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-navy/70">Validation de ton paiement…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white border border-navy/10 rounded-xl px-4 py-6">
              <p className="text-sm text-navy mb-2">
                On n'a pas pu confirmer ton paiement pour l'instant.
              </p>
              <p className="text-xs text-navy/60 mb-4">
                Si tu as été débité, ne t'inquiète pas : tu recevras un e-mail de confirmation avec le lien pour choisir ta date.
              </p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm py-2 px-5">
                Retour au Dashboard
              </button>
            </div>
          )}

          {status === 'ready' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
                <p className="text-sm text-green-800">
                  {dateDone
                    ? 'Ta date est enregistrée. Tu vas recevoir un e-mail de confirmation. Retour au Dashboard…'
                    : 'Paiement confirmé — choisis maintenant ton créneau ci-dessous.'}
                </p>
              </div>

              {!dateDone && (
                <>
                  <h1 className="font-serif text-2xl text-navy mb-4">
                    {atelier?.titre ? `${atelier.titre} : choisis ta date` : 'Choisis ta date'}
                  </h1>

                  {atelier?.calendly_url ? (
                    <div
                      ref={widgetRef}
                      className="rounded-xl overflow-hidden bg-white"
                      style={{ minWidth: '320px', height: '700px' }}
                    />
                  ) : (
                    <div className="bg-white border border-navy/10 rounded-xl px-4 py-6">
                      <p className="text-sm text-navy/70">
                        Le calendrier n'est pas encore configuré pour cet atelier.
                        Ton paiement est bien enregistré, tu seras prévenu par e-mail dès que les dates seront ouvertes.
                      </p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-navy/50 hover:text-navy transition-colors mt-4"
              >
                {dateDone ? 'Aller au Dashboard →' : 'Choisir plus tard, retour au Dashboard →'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ml-0 sm:ml-16">
        <Footer />
      </div>
    </div>
  )
}
