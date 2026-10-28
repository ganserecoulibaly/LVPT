import { useEffect } from 'react'
import { supabase } from './supabaseClient'
import { sourceInscription } from './attribution'

// Inscription via Google : le compte est créé sans provenance (le navigateur quitte le site
// puis revient). À la 1re connexion, on complète la provenance si le compte vient d'être créé.
async function completerProvenance(userId) {
  const { data } = await supabase.from('lvpt').select('source_inscription, created_at').eq('id', userId).maybeSingle()
  if (!data || data.source_inscription) return
  const age = Date.now() - new Date(data.created_at).getTime()
  if (age > 15 * 60 * 1000) return
  await supabase.from('lvpt').update({ source_inscription: sourceInscription() }).eq('id', userId)
}

export default function AttributionSync() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => { completerProvenance(session.user.id).catch(() => {}) }, 0)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])
  return null
}
