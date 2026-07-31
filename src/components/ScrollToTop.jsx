import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Remonte en haut de page à chaque changement de route. Sans ça,
// React Router garde le scroll hérité de la page précédente — c'est
// pour ça qu'un lien cliqué en bas d'une longue liste (ex: itinéraires)
// ouvrait la page de détail déjà scrollée tout en bas.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
