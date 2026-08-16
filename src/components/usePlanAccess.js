import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Même ordre que Sidebar.jsx — à garder synchronisé si un plan est
// ajouté un jour.
const PLAN_ORDER = ['free', 'occasional', 'frequent']

// Vérifie que l'utilisateur a bien le plan requis pour une page
// premium — indispensable en plus du lien caché dans Sidebar, qui ne
// protège rien à lui seul (accès direct par URL sinon possible).
//
// Usage dans une page :
//   const { user, allowed } = usePlanAccess('occasional')
//   if (!user || allowed === null) return null
//   if (!allowed) return <PageBloquee ... />
export function usePlanAccess(requiredPlan) {
  const [user, setUser] = useState(null)
  const [allowed, setAllowed] = useState(null) // null = en cours de vérification

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('abonnement, is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.is_admin) {
          setAllowed(true)
          return
        }
        const currentPlan = data?.abonnement || 'free'
        setAllowed(PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan))
      })
  }, [user, requiredPlan])

  return { user, allowed }
}
