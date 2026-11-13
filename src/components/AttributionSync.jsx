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
    // Au retour de Google, la session peut être déjà établie avant que ce composant s'abonne :
    // on vérifie donc aussi la session en cours (INITIAL_SESSION / getSession), pas seulement SIGNED_IN.
    const verifier = (userId) => { completerProvenance(userId).catch(() => {}) }

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) verifier(data.session.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setTimeout(() => verifier(session.user.id), 0)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])
  return null
}
