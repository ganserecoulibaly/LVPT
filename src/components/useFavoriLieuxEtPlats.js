import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const GRADIENTS = [
  'from-[#D85A30]/30 to-[#8B2F1A]/20',
  'from-[#F0997B]/40 to-[#D85A30]/20',
  'from-navy/20 to-navy/5',
]

function transformLieuxFavoris(rows) {
  return rows.map((r, i) => ({
    id: r.id_lieu, type: 'lieu',
    title: r.nom,
    price: 'Lieu à visiter',
    date: `${r.ville}${r.quartier ? ` — ${r.quartier}` : ''}, ${r.pays}`,
    emoji: '🏛️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: null,
  }))
}

function transformPlatsFavoris(rows) {
  return rows.map((r, i) => ({
    id: r.id_plat, type: 'plat',
    title: r.nom_plat,
    price: r.prix,
    date: `${r.nom_restaurant} · ${r.ville}, ${r.pays}`,
    emoji: '🍽️', fallbackGradient: GRADIENTS[i % GRADIENTS.length],
    image: r.lien_photo || null,
  }))
}

// Récupère les lieux (Activités & musées) et plats (Carnet
// gastronomique) mis en favoris par l'utilisateur, prêts à fusionner
// dans le favoriteDeals de n'importe quelle page ayant une modale
// "Mes favoris". Ne charge que les entrées favorites, jamais tout le
// catalogue — léger même sur une page qui n'a rien à voir avec ces
// deux sections. Retourne aussi un toggle générique (basé sur
// deal.type, marche pour 'lieu' ET 'plat') et une fonction refetch,
// utiles pour les pages où la modale "Mes favoris" affiche
// exclusivement ces deux types (Activites.jsx, Gastronomie.jsx).
export function useFavoriLieuxEtPlats(user) {
  const [favoriLieuxEtPlats, setFavoriLieuxEtPlats] = useState([])

  const refetch = async () => {
    if (!user) return
    const { data: favoris } = await supabase
      .from('favoris')
      .select('id_entite, nom')
      .eq('pid', user.id)
      .eq('actif', true)
      .in('nom', ['lieu', 'plat'])

    const idsLieux = (favoris || []).filter((f) => f.nom === 'lieu').map((f) => f.id_entite)
    const idsPlats = (favoris || []).filter((f) => f.nom === 'plat').map((f) => f.id_entite)

    const [{ data: lieuxFav }, { data: platsFav }] = await Promise.all([
      idsLieux.length ? supabase.from('d_lieu').select('*').in('id_lieu', idsLieux) : Promise.resolve({ data: [] }),
      idsPlats.length ? supabase.from('d_plat').select('*').in('id_plat', idsPlats) : Promise.resolve({ data: [] }),
    ])

    setFavoriLieuxEtPlats([
      ...transformLieuxFavoris(lieuxFav || []),
      ...transformPlatsFavoris(platsFav || []),
    ])
  }

  useEffect(() => { refetch() }, [user])

  const toggleFavoriGeneric = async (deal) => {
    const isFav = favoriLieuxEtPlats.some((d) => d.type === deal.type && d.id === deal.id)
    const { error } = isFav
      ? await supabase.from('favoris').update({ actif: false }).eq('pid', user.id).eq('id_entite', deal.id).eq('nom', deal.type)
      : await supabase.from('favoris').upsert(
          { pid: user.id, id_entite: deal.id, nom: deal.type, actif: true },
          { onConflict: 'pid,id_entite,nom' }
        )
    if (error) {
      alert('Impossible de mettre à jour ce favori : ' + error.message)
      return
    }
    refetch()
  }

  return { favoriLieuxEtPlats, refetchFavoriLieuxEtPlats: refetch, toggleFavoriGeneric }
}
