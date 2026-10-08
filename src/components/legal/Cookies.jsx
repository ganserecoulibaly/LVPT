import React from 'react'
import LegalPageLayout from './LegalPageLayout'
import { openCookieSettings } from '../CookieConsent'

export default function Cookies() {
  return (
    <LegalPageLayout title="Politique cookies" updatedAt="9 octobre 2026">
      <p>Cette politique explique l'utilisation des cookies et technologies similaires sur Le Voyage Pour Tous (LVPT).</p>
      <h2>1. Cookies nécessaires</h2>
      <p>Certains cookies ou identifiants techniques peuvent être nécessaires à l'authentification, à la sécurité, au fonctionnement du service ou à la mémorisation de votre choix de consentement. Lorsqu'ils sont strictement nécessaires au service demandé, ils peuvent être utilisés sans consentement préalable conformément aux règles applicables.</p>
      <h2>2. Mesure d'audience</h2>
      <p>LVPT utilise Google Analytics, Hotjar et Metricool afin de comprendre l'utilisation du site, de mesurer l'audience et l'origine des visites, et d'améliorer l'expérience utilisateur. Ces outils ne sont activés qu'après votre consentement.</p>
      <h2>3. Votre choix</h2>
      <p>Vous pouvez accepter ou refuser ces outils via le bandeau présenté lors de votre première visite. Le refus n'empêche pas l'accès aux fonctionnalités qui ne nécessitent pas ces outils.</p>
      <h2>4. Gestion des préférences</h2>
      <p>Votre choix est mémorisé afin de ne pas vous redemander inutilement votre décision. Vous pouvez le modifier ou retirer votre consentement à tout moment, aussi simplement que vous l'avez donné, via le lien « Gérer les cookies » présent en bas de chaque page, ou directement ici :</p>
      <p>
        <button
          type="button"
          onClick={openCookieSettings}
          className="text-coral hover:underline font-medium"
        >
          Gérer mes préférences cookies
        </button>
      </p>
      <p>En cas de retrait du consentement, les cookies de mesure d'audience déposés sur votre navigateur sont supprimés.</p>
      <h2>5. Prestataires concernés</h2>
      <p>Les services techniques et analytiques utilisés par LVPT peuvent traiter des identifiants selon leur propre fonctionnement. Les principaux prestataires concernés sont décrits dans la <a href="/confidentialite" className="text-coral hover:underline">politique de confidentialité</a>.</p>
      <h2>6. Contact</h2>
      <p>Pour toute question relative aux cookies : <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">levoyagepourtous@gmail.com</a>.</p>
    </LegalPageLayout>
  )
}
