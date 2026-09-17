import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function Cookies() {
  return (
    <LegalPageLayout title="Politique cookies" updatedAt="17 septembre 2026">
      <p>Cette politique explique l'utilisation des cookies et technologies similaires sur Le Voyage Pour Tous (LVPT).</p>
      <h2>1. Cookies nécessaires</h2>
      <p>Certains cookies ou identifiants techniques peuvent être nécessaires à l'authentification, à la sécurité, au fonctionnement du service ou à la mémorisation de votre choix de consentement. Lorsqu'ils sont strictement nécessaires au service demandé, ils peuvent être utilisés sans consentement préalable conformément aux règles applicables.</p>
      <h2>2. Mesure d'audience</h2>
      <p>LVPT utilise ou peut utiliser Google Analytics et Hotjar afin de comprendre l'utilisation du site et d'améliorer l'expérience utilisateur. Ces outils sont activés selon le mécanisme de consentement mis en place par LVPT lorsque le consentement est requis.</p>
      <h2>3. Votre choix</h2>
      <p>Lorsque le consentement est requis, vous pouvez accepter ou refuser les technologies concernées via le bandeau présenté sur le site. Le refus n'empêche pas l'accès aux fonctionnalités qui ne nécessitent pas ces outils.</p>
      <h2>4. Gestion des préférences</h2>
      <p>Votre choix est mémorisé afin de ne pas vous redemander inutilement votre décision. Vous pouvez demander à modifier vos préférences lorsque le mécanisme de gestion du consentement est disponible sur le site.</p>
      <h2>5. Prestataires concernés</h2>
      <p>Les services techniques et analytiques utilisés par LVPT peuvent traiter des identifiants selon leur propre fonctionnement. Les principaux prestataires concernés sont décrits dans la <a href="/confidentialite" className="text-coral hover:underline">politique de confidentialité</a>.</p>
      <h2>6. Contact</h2>
      <p>Pour toute question relative aux cookies : <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>
    </LegalPageLayout>
  )
}
