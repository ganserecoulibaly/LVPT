import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function MentionsLegales() {
  return (
    <LegalPageLayout title="Mentions légales" updatedAt="17 septembre 2026">
      <h2>1. Éditeur du site</h2>
      <p>Le site <strong>Le Voyage Pour Tous (LVPT)</strong> est édité et exploité par une personne physique exerçant sous le statut d'entrepreneur individuel.</p>
      <ul>
        <li><strong>Nom et prénom :</strong> NOM PRÉNOM</li>
        <li><strong>Statut :</strong> ENTREPRENEUR INDIVIDUEL (EI)</li>
        <li><strong>Nom commercial :</strong> LE VOYAGE POUR TOUS</li>
        <li><strong>Adresse professionnelle :</strong> ADRESSE, CODE POSTAL VILLE, PAYS</li>
        <li><strong>SIREN :</strong> SIREN</li>
        <li><strong>SIRET :</strong> SIRET</li>
        <li><strong>RNE :</strong> RNE</li>
        <li><strong>RCS :</strong> RCS — VILLE, SI APPLICABLE</li>
        <li><strong>TVA intracommunautaire :</strong> NUMÉRO TVA INTRACOMMUNAUTAIRE, SI APPLICABLE</li>
        <li><strong>Email :</strong> EMAIL</li>
        <li><strong>Téléphone :</strong> TÉLÉPHONE</li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p><strong>NOM PRÉNOM</strong>, en qualité de représentant légal de l'entreprise individuelle éditrice du site.</p>

      <h2>3. Hébergement</h2>
      <p>Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>
      <p>Les services techniques utilisés par LVPT peuvent également faire intervenir des prestataires distincts pour la base de données, l'authentification, les paiements, l'envoi d'emails et la sécurité. Ces prestataires sont décrits dans la politique de confidentialité.</p>

      <h2>4. Propriété intellectuelle</h2>
      <p>La structure, le design, le logo, les textes, éléments graphiques, fonctionnalités et contenus éditoriaux créés pour LVPT sont protégés par les droits applicables et appartiennent à l'éditeur, sauf mention contraire.</p>
      <p>Les contenus publiés par les utilisateurs restent leur propriété. L'utilisateur accorde à LVPT les droits nécessaires à leur hébergement, affichage, reproduction technique et diffusion au sein du service, conformément aux CGU.</p>

      <h2>5. Contenus et informations de voyage</h2>
      <p>LVPT peut présenter des informations relatives aux destinations, transports, hébergements, activités, tarifs, disponibilités, promotions et recommandations. Ces informations peuvent évoluer et ne constituent pas une garantie de disponibilité, de prix ou de qualité du service fourni par un tiers.</p>
      <p>Lorsque LVPT redirige vers un prestataire tiers, la réservation ou l'achat est conclu directement avec ce prestataire et selon ses propres conditions.</p>

      <h2>6. Contenus publiés par les utilisateurs</h2>
      <p>Les utilisateurs peuvent publier notamment des itinéraires, conseils, bons plans, alertes et autres contenus communautaires. Ils restent responsables des contenus qu'ils publient. Les modalités applicables sont précisées dans les CGU.</p>

      <h2>7. Signalement</h2>
      <p>Tout contenu susceptible de porter atteinte aux droits d'un tiers ou de contrevenir à la loi peut être signalé à <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>
    </LegalPageLayout>
  )
}
