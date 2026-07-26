import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

/**
 * Enveloppe n'importe quelle page privée.
 * Usage dans App.jsx :
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/carnet" element={<ProtectedRoute><Carnet /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'guest'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'guest')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authed' : 'guest')
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-navy/60 text-sm">Chargement...</p>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/" replace />
  }

  return children
}
