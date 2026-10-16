// Partage WhatsApp.
//
// Un lien https://wa.me/... ouvert depuis un navigateur de téléphone affiche
// souvent la page web de WhatsApp ("Télécharger l'application") même quand
// l'appli est installée. Sur mobile, on ouvre donc l'appli directement par
// son lien natif (whatsapp://send) ; si rien ne s'est passé après 1,5 s
// (appli absente), on retombe sur la version web. Sur ordinateur, wa.me
// reste le bon choix (WhatsApp Web ou appli de bureau).

export function whatsappWebUrl(text) {
  return 'https://wa.me/?text=' + encodeURIComponent(text)
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// À appeler depuis un clic (geste utilisateur). Renvoie true si elle a pris
// la main (mobile), false si le lien classique doit suivre son cours.
export function openWhatsAppOnMobile(text) {
  if (!isMobileDevice()) return false

  let pageLeft = false
  const onVisibility = () => { if (document.hidden) pageLeft = true }
  document.addEventListener('visibilitychange', onVisibility)

  window.location.href = 'whatsapp://send?text=' + encodeURIComponent(text)

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    if (!pageLeft && !document.hidden) window.location.href = whatsappWebUrl(text)
  }, 1500)
  return true
}
