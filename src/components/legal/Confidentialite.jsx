import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function Confidentialite() {
  return (
    <LegalPageLayout title="Politique de confidentialité" updatedAt="17 septembre 2026">
      <p>La présente politique décrit les traitements de données personnelles mis en œuvre dans le cadre de Le Voyage Pour Tous (LVPT).</p>

      <h2>1. Responsable du traitement</h2>
      <p>Le responsable du traitement est <strong>NOM PRÉNOM</strong>, entrepreneur individuel et éditeur de LVPT.</p>
      <p>Contact : <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>

      <h2>2. Données concernées</h2>
      <ul>
        <li><strong>Compte et profil :</strong> nom, prénom, adresse email, téléphone lorsqu'il est renseigné, préférences et informations de profil.</li>
        <li><strong>Connexion :</strong> informations nécessaires à l'authentification par email/mot de passe ou via Google lorsque cette option est utilisée.</li>
        <li><strong>Contenus :</strong> itinéraires, lieux, activités, gastronomie, playlists, spas, dépenses et autres contenus enregistrés dans les modules personnels ; contenus publiés dans Le Comptoir Voyage et autres espaces communautaires.</li>
        <li><strong>Interactions :</strong> favoris, votes, commentaires, propositions et signalements lorsqu'ils sont proposés par le service.</li>
        <li><strong>Abonnement et paiement :</strong> informations relatives au plan souscrit et à la transaction. Les coordonnées bancaires sont traitées par Stripe et ne sont pas stockées par LVPT.</li>
        <li><strong>Données techniques :</strong> informations nécessaires au fonctionnement, à la sécurité et à la prévention des abus, selon les services techniques utilisés.</li>
        <li><strong>Communications :</strong> données nécessaires à l'envoi des emails de service et, lorsque vous y avez consenti, des communications marketing.</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li><strong>Compte et fonctionnalités LVPT :</strong> exécution du contrat ou mesures précontractuelles.</li>
        <li><strong>Gestion des abonnements et paiements :</strong> exécution du contrat et obligations légales applicables.</li>
        <li><strong>Sécurité, prévention de la fraude et protection du service :</strong> intérêt légitime de l'éditeur, sous réserve des règles applicables.</li>
        <li><strong>Emails strictement nécessaires au service :</strong> exécution du contrat.</li>
        <li><strong>Newsletter et communications marketing :</strong> consentement lorsqu'il est requis.</li>
        <li><strong>Analytics et mesure d'audience non exemptés :</strong> consentement lorsqu'il est requis.</li>
      </ul>

      <h2>4. Modules personnels et données de voyage</h2>
      <p>Les informations que vous saisissez dans vos itinéraires, dépenses, playlists, carnets, activités, spas ou autres modules sont traitées afin de fournir les fonctionnalités correspondantes. Vous restez responsable de ne pas saisir de données sensibles ou de données concernant des tiers lorsque cela n'est pas nécessaire au service.</p>

      <h2>5. Contenus communautaires</h2>
      <p>Lorsque vous publiez un contenu dans Le Comptoir Voyage ou dans un espace communautaire, certaines informations associées au contenu peuvent être visibles par les autres utilisateurs conformément au fonctionnement du service. Ne publiez pas d'informations personnelles que vous ne souhaitez pas rendre publiques.</p>

      <h2>6. Prestataires et destinataires</h2>
      <ul>
        <li><strong>Supabase :</strong> base de données et authentification.</li>
        <li><strong>Vercel :</strong> hébergement et infrastructure de déploiement.</li>
        <li><strong>Stripe :</strong> paiement et gestion technique des abonnements.</li>
        <li><strong>Google :</strong> authentification Google lorsque vous choisissez cette option.</li>
        <li><strong>Resend :</strong> envoi d'emails lorsque ce service est utilisé par LVPT.</li>
        <li><strong>Cloudflare Turnstile :</strong> protection contre les inscriptions automatisées et abus.</li>
        <li><strong>Google Analytics / Hotjar :</strong> analyse et compréhension de l'utilisation du site lorsque ces outils sont activés conformément à votre consentement et aux règles applicables.</li>
      </ul>

      <h2>7. Transferts internationaux</h2>
      <p>Certains prestataires utilisés par LVPT peuvent traiter des données en dehors de l'Espace économique européen. Lorsque cela est applicable, les transferts sont encadrés conformément aux exigences du RGPD et aux garanties mises en œuvre par le prestataire concerné.</p>

      <h2>8. Durées de conservation</h2>
      <p>Les données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles sont traitées, à la gestion du compte et aux obligations légales applicables. Les durées précises peuvent varier selon la catégorie de données et le traitement concerné.</p>
      <p>Lorsqu'un compte est supprimé, LVPT applique les règles techniques prévues pour la suppression ou l'anonymisation du compte et la conservation éventuelle des contenus communautaires lorsque celle-ci est nécessaire au maintien des échanges.</p>

      <h2>9. Vos droits</h2>
      <p>Vous disposez, dans les conditions prévues par le RGPD, de droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Lorsque le traitement repose sur votre consentement, vous pouvez le retirer à tout moment pour l'avenir.</p>
      <p>Vous pouvez exercer vos droits depuis les fonctionnalités disponibles dans votre compte ou en écrivant à <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>
      <p>Vous pouvez également introduire une réclamation auprès de la CNIL.</p>

      <h2>10. Cookies et technologies similaires</h2>
      <p>Les cookies et technologies similaires sont détaillés dans la <a href="/cookies" className="text-coral hover:underline">politique cookies</a>. Les outils soumis au consentement ne sont pas activés avant celui-ci lorsque le consentement est requis.</p>

      <h2>11. Mineurs</h2>
      <p>LVPT est destiné aux personnes âgées de 18 ans et plus. Si vous pensez qu'un mineur nous a transmis des données personnelles de manière inappropriée, contactez-nous.</p>

      <h2>12. Modifications</h2>
      <p>Cette politique peut être mise à jour afin de refléter l'évolution de LVPT, de ses fonctionnalités ou des obligations applicables. La date de mise à jour est indiquée en haut de cette page.</p>
    </LegalPageLayout>
  )
}
