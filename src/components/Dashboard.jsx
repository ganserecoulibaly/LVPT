import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Pas connecté → retour à l'accueil
        navigate('/')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/')
      } else {
        setUser(session.user)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-navy/60 text-sm">Chargement...</p>
      </div>
    )
  }

  if (!user) return null

  // Récupère le prénom : d'abord depuis nos champs custom (inscription email),
  // sinon depuis les métadonnées fournies par Google (given_name / full_name)
  const firstName =
    user.user_metadata?.first_name ||
    user.user_metadata?.given_name ||
    user.user_metadata?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0]

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <span className="font-serif text-navy font-medium text-lg">Le Voyage Pour Tous</span>
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-navy/60 hover:text-coral transition-colors"
          >
            Se déconnecter
          </button>
        </div>

        <h1 className="font-serif text-3xl text-navy mb-2">
          Dashboard
        </h1>
        <p className="text-navy/70">
          Bienvenue, {firstName} 👋
        </p>
      </div>
    </div>
  )
}
