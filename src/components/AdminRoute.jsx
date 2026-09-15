import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

/**
 * Protège une page réservée à l'administrateur.
 * L'utilisateur doit être authentifié ET avoir is_admin = true dans lvpt.
 */
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('loading') // loading | allowed | denied

  useEffect(() => {
    let mounted = true

    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        if (mounted) setStatus('denied')
        return
      }

      const { data, error } = await supabase
        .from('lvpt')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!mounted) return
      setStatus(!error && data?.is_admin === true ? 'allowed' : 'denied')
    }

    checkAdmin()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAdmin()
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-navy/60 text-sm">Chargement...</p>
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
