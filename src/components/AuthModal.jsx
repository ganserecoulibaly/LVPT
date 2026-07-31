import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AirportAutocomplete from './AirportAutocomplete'

// Site Key Turnstile définie dans le fichier .env (VITE_TURNSTILE_SITE_KEY)
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function AuthModal({ onClose, initialMode = 'login' }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [villeDepartFav, setVilleDepartFav] = useState('')
  const [paysDepartFav, setPaysDepartFav] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  const turnstileContainerRef = useRef(null)
  const turnstileWidgetIdRef = useRef(null)

  // Charge et affiche le widget Turnstile une fois le script disponible
  useEffect(() => {
    let cancelled = false

    function renderWidget() {
      if (cancelled) return
      if (!window.turnstile || !turnstileContainerRef.current) {
        // Le script se charge de façon asynchrone (voir index.html) :
        // on réessaie un peu plus tard s'il n'est pas encore prêt.
        setTimeout(renderWidget, 100)
        return
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }

    renderWidget()

    return () => {
      cancelled = true
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
      }
    }
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken('')
    if (window.turnstile && turnstileWidgetIdRef.current) {
      window.turnstile.reset(turnstileWidgetIdRef.current)
    }
  }

  const resetFeedback = () => {
    setError(null)
    setMessage(null)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setConfirmPassword('')
    resetFeedback()
  }

  const handleGoogleAuth = async () => {
    resetFeedback()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) setError(error.message)
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    resetFeedback()

    if (!captchaToken) {
      setError('Merci de valider le contrôle de sécurité ci-dessous.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        setLoading(false)
        resetCaptcha()
        return
      }

      if (!villeDepartFav) {
        setError('Merci de choisir ton aéroport de départ dans la liste proposée.')
        setLoading(false)
        resetCaptcha()
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          captchaToken,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            phone: phone || null,
            newsletter_opt_in: newsletter,
            // AirportAutocomplete renvoie "Ville (CODE)" (ex: "Paris (CDG)"),
            // on ne garde que le nom de ville : simple et lisible, sert
            // directement pour le matching avec d_vol.aeroport_depart.
            ville_depart_fav: villeDepartFav.split(' (')[0].trim(),
            pays_depart_fav: paysDepartFav || null,
          },
        },
      })
      if (error) {
        setError(error.message)
      } else if (data?.user?.identities?.length === 0) {
        // Supabase répond "succès" même si l'email existe déjà (anti-énumération).
        // Un tableau "identities" vide est l'indice qu'un compte existe déjà pour cet email.
        setError(
          'Un compte existe déjà avec cet email. Essaie de te connecter, ou réinitialise ton mot de passe si tu l\'as oublié.'
        )
      } else {
        setSignupSuccess(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })
      if (error) {
        setError(error.message)
      } else {
        onClose()
        navigate('/dashboard')
      }
    }
    resetCaptcha()
    setLoading(false)
  }

  // Note mobile : le champ texte utilise text-base (16px) plutôt que text-sm.
  // En dessous de 16px, Safari iOS zoome automatiquement la page au focus d'un input.
  const inputClass =
    'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-base focus:outline-none focus:border-coral'

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      {/*
        m-auto (au lieu de items-center sur le parent) est le trick qui évite
        le bug classique : sur mobile, quand le contenu de la modale dépasse
        la hauteur de l'écran, "items-center" empêche de scroller jusqu'en haut.
        m-auto centre quand ça rentre, et laisse le scroll fonctionner sinon.
      */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm relative m-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {signupSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <p className="font-serif text-lg text-navy mb-2">Vérifie ta boîte mail</p>
            <p className="text-sm text-navy/60 mb-1">
              On vient d'envoyer un email de confirmation à
            </p>
            <p className="text-sm font-medium text-navy mb-6">{email}</p>
            <p className="text-xs text-navy/50 mb-6">
              Clique sur le lien qu'il contient pour activer ton compte, puis reviens te connecter.
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full text-sm py-2.5"
            >
              J'ai compris
            </button>
          </div>
        ) : (
          <>
        <p className="font-serif text-lg text-navy text-center mb-1">
          {mode === 'login' ? 'Content de te revoir' : "Rejoins l'aventure"}
        </p>
        <p className="text-sm text-navy/55 text-center mb-6">
          Accède à ton carnet de voyage.
        </p>

        <button
          onClick={handleGoogleAuth}
          className="w-full border border-navy/15 rounded-full py-2.5 text-sm text-navy flex items-center justify-center gap-2 hover:bg-navy/5 transition-colors mb-5"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-navy/10" />
          <span className="text-xs text-navy/40">ou par email</span>
          <div className="flex-1 h-px bg-navy/10" />
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs text-navy/50 mb-1 block">
                  Prénom<span className="text-coral"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-navy/50 mb-1 block">
                  Nom<span className="text-coral"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-navy/50 mb-1 block">
              Email<span className="text-coral"> *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className={inputClass}
              autoComplete="email"
            />
          </div>

          {mode === 'signup' && (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone (facultatif)"
              className={inputClass}
              autoComplete="tel"
            />
          )}

          {mode === 'signup' && (
            <AirportAutocomplete
              label="Aéroport de départ favori"
              placeholder="Paris (CDG)"
              value={villeDepartFav}
              onChange={(val) => setVilleDepartFav(val)}
              onSelectAirport={(airport) => setPaysDepartFav(airport.country)}
              required
            />
          )}

          <div>
            <label className="text-xs text-navy/50 mb-1 block">
              Mot de passe<span className="text-coral"> *</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className={inputClass}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs text-navy/50 mb-1 block">
                Confirmer le mot de passe<span className="text-coral"> *</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-xs text-navy/60 mt-1">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              Je souhaite recevoir la newsletter et les bons plans voyage.
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          {/* Widget Turnstile (protection anti-bot) */}
          <div ref={turnstileContainerRef} className="flex justify-center" />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm py-2.5 mt-1 disabled:opacity-60 flex items-center justify-center text-center"
          >
            {loading ? 'Un instant...' : 'Continuer'}
          </button>
        </form>

        <p className="text-xs text-navy/55 text-center mt-5">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button onClick={() => switchMode('signup')} className="text-coral font-medium">
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button onClick={() => switchMode('login')} className="text-coral font-medium">
                Se connecter
              </button>
            </>
          )}
        </p>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.6 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  )
}
