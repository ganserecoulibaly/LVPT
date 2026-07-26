import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const feedIcons = {
  itineraire: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/>
      <path d="M8 19h7a4 4 0 0 0 4-4 4 4 0 0 0-4-4H9a4 4 0 0 1-4-4 4 4 0 0 1 4-4h7"/>
    </svg>
  ),
  arnaque: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  conseil: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  // Icônes ajoutées pour les catégories Voyage Commun (bon plan, promo, vol, hôtel)
  bonplan: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9 8h4a2 2 0 0 1 0 4H9m0 0h4a2 2 0 0 1 0 4H9m2-12v12"/>
    </svg>
  ),
  promo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.83 0l-8.3-8.3a2 2 0 0 1-.57-1.42V4a2 2 0 0 1 2-2h6.88a2 2 0 0 1 1.42.57l8.3 8.3a2 2 0 0 1 0 2.83Z"/>
      <circle cx="7.5" cy="7.5" r="1.5"/>
    </svg>
  ),
  vol: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 2.7 5.9c.3.7 1.2.8 1.7.3l.8-.7c.4-.3.6-.8.5-1.3z"/>
    </svg>
  ),
  hotel: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/>
      <path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  voyageCommun: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
}

const STYLES = {
  itineraire: { bg: 'bg-coral/10', text: 'text-coral', label: 'Itinéraire', icon: 'itineraire' },
  arnaque: { bg: 'bg-red-50', text: 'text-red-600', label: 'Alerte', icon: 'arnaque' },
  'bons plans': { bg: 'bg-navy/10', text: 'text-navy', label: 'Bon plan', icon: 'conseil' },
  visite: { bg: 'bg-navy/10', text: 'text-navy', label: 'Visite', icon: 'conseil' },
  // Catégories Voyage Commun (clé = nom de catégorie en minuscule).
  // Si tu ajoutes une nouvelle catégorie en base, ajoute son entrée ici
  // pour qu'elle ait sa propre couleur/icône ; sinon elle retombe sur le
  // style générique "voyageCommunDefault" ci-dessous.
  'bon plan': { bg: 'bg-green-50', text: 'text-green-700', label: 'Bon plan', icon: 'bonplan' },
  promo: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Promo', icon: 'promo' },
  vol: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Vol', icon: 'vol' },
  hôtel: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Hôtel', icon: 'hotel' },
  conseil: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Conseil', icon: 'conseil' },
  voyageCommunDefault: { bg: 'bg-navy/10', text: 'text-navy', label: 'Voyage commun', icon: 'voyageCommun' },
}

const AVATAR_COLORS = ['bg-coral', 'bg-navy', 'bg-[#F0997B]', 'bg-[#8B2F1A]', 'bg-[#4A6FA5]']

function timeAgo(dateString) {
  const diffMs = new Date() - new Date(dateString)
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return "à l'instant"
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

const ACTION_LABELS = {
  itineraire: 'a ajouté un itinéraire',
  arnaque: 'a signalé une arnaque',
  'bons plans': 'a partagé un bon plan',
  visite: 'a partagé une visite',
  // Voyage Commun : un libellé par catégorie connue, plus un générique
  // pour toute catégorie ajoutée plus tard et pas encore listée ici.
  'bon plan': 'a partagé un bon plan',
  promo: 'a partagé une promo',
  vol: 'a partagé une alerte vol',
  hôtel: 'a partagé un hôtel',
  conseil: 'a partagé un conseil',
  voyageCommunDefault: 'a publié sur Voyage commun',
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
      const { data: feed } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!feed || feed.length === 0) {
        setLoading(false)
        return
      }

      const pids = [...new Set(feed.map((f) => f.pid))]
      const conseilIds = feed.filter((f) => f.type === 'conseil').map((f) => f.id_entite)
      const voyageCommunIds = feed.filter((f) => f.type === 'voyage_commun').map((f) => f.id_entite)

      const [{ data: users }, { data: conseils }, { data: voyageCommunPosts }, { data: voyageCommunCategories }] = await Promise.all([
        supabase.from('public_profiles').select('id, prenom').in('id', pids),
        conseilIds.length
          ? supabase.from('conseil_partage').select('id_conseil, type').in('id_conseil', conseilIds)
          : Promise.resolve({ data: [] }),
        voyageCommunIds.length
          ? supabase.from('s_voyage_commun').select('id_post, id_categorie').in('id_post', voyageCommunIds)
          : Promise.resolve({ data: [] }),
        voyageCommunIds.length
          ? supabase.from('voyage_commun_categorie').select('id_categorie, nom')
          : Promise.resolve({ data: [] }),
      ])

      const nameById = Object.fromEntries((users || []).map((u) => [u.id, u.prenom || 'Un voyageur']))
      const conseilTypeById = Object.fromEntries((conseils || []).map((c) => [c.id_conseil, c.type]))

      // id_post -> nom de catégorie (en minuscule), pour retrouver le style
      // et le libellé correspondants dans STYLES/ACTION_LABELS.
      const categorieNomById = Object.fromEntries((voyageCommunCategories || []).map((c) => [c.id_categorie, c.nom]))
      const voyageCommunSubTypeByPostId = Object.fromEntries(
        (voyageCommunPosts || []).map((p) => [p.id_post, (categorieNomById[p.id_categorie] || '').toLowerCase()])
      )

      const enriched = feed.map((entry) => {
        let subType = 'bons plans'
        if (entry.type === 'itineraire') {
          subType = 'itineraire'
        } else if (entry.type === 'conseil') {
          subType = conseilTypeById[entry.id_entite] || 'bons plans'
        } else if (entry.type === 'voyage_commun') {
          subType = voyageCommunSubTypeByPostId[entry.id_entite] || 'voyageCommunDefault'
        }
        return {
          ...entry,
          userName: nameById[entry.pid] || 'Un voyageur',
          subType,
        }
      })

      setEntries(enriched)
      setLoading(false)
    }
    loadFeed()
  }, [])

  if (loading || entries.length === 0) return null

  return (
    <div className="mb-10">
      <p className="font-serif text-lg text-navy mb-4">Quoi de neuf dans la communauté</p>

      <div className="bg-white rounded-xl border border-navy/10 divide-y divide-navy/5">
        {entries.map((entry, i) => {
          const style = STYLES[entry.subType] || (entry.type === 'voyage_commun' ? STYLES.voyageCommunDefault : STYLES.itineraire)
          const actionLabel = ACTION_LABELS[entry.subType] || (entry.type === 'voyage_commun' ? ACTION_LABELS.voyageCommunDefault : 'a partagé quelque chose')
          return (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs font-medium flex items-center justify-center shrink-0`}>
                {entry.userName.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy truncate">
                  <span className="font-medium">{entry.userName}</span> {actionLabel}
                </p>
                <p className="text-xs text-navy/50 truncate">{entry.detail}</p>
              </div>

              <span className={`hidden sm:flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full shrink-0 ${style.bg} ${style.text}`}>
                {feedIcons[style.icon]}
                {style.label}
              </span>

              <span className="text-[11px] text-navy/35 shrink-0 w-16 text-right">{timeAgo(entry.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
