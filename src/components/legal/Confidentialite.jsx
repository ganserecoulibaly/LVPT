import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function Confidentialite() {
  return (
    <LegalPageLayout title="Politique de confidentialité" updatedAt="31 juillet 2026">
      <p>
        Le Voyage Pour Tous accorde une attention particulière à la
        protection des données personnelles de ses utilisateurs,
        conformément au Règlement Général sur la Protection des Données
        (RGPD).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est l'entreprise
        individuelle éditrice du site (voir les{' '}
        <a href="/mentions-legales" className="text-coral hover:underline">mentions légales</a>).
        Pour toute question relative à vos données personnelles :{' '}
        <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">
          levoyagepourtous@gmail.com
        </a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Selon votre usage du site, nous collectons :</p>
      <ul>
        <li><strong>À l'inscription</strong> : prénom, nom, email, téléphone (facultatif), aéroport de départ favori.</li>
        <li><strong>Via Google</strong> (si vous vous connectez ainsi) : nom, email, photo de profil transmis par Google.</li>
        <li><strong>Contenus publiés</strong> : itinéraires, posts et commentaires Voyage Commun, votes, idées de fonctionnalités proposées.</li>
        <li><strong>Paiement</strong> : traité entièrement par Stripe — nous ne recevons jamais vos coordonnées bancaires.</li>
        <li><strong>Techniques</strong> : adresse IP et données de navigation nécessaires à la sécurité (protection anti-robot Cloudflare Turnstile lors de l'inscription).</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Créer et gérer votre compte utilisateur ;</li>
        <li>Vous proposer des vols, hébergements et activités pertinents ;</li>
        <li>Afficher votre nom et vos contenus aux autres utilisateurs du site ;</li>
        <li>Traiter vos paiements d'abonnement ;</li>
        <li>Sécuriser le site (lutte contre les inscriptions automatisées) ;</li>
        <li>Vous envoyer des emails liés à votre compte, et notre newsletter si vous y avez consenti.</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Les traitements reposent sur l'exécution du contrat qui vous lie à
        l'éditeur (fourniture du service), sur votre consentement (pour la
        newsletter) et sur l'intérêt légitime de l'éditeur (sécurité du
        site).
      </p>

      <h2>5. Sous-traitants et hébergement</h2>
      <p>
        Vos données sont hébergées et traitées par les prestataires
        suivants, dans le cadre de la fourniture du service :
      </p>
      <ul>
        <li><strong>Supabase</strong> — base de données et authentification ;</li>
        <li><strong>Vercel</strong> — hébergement du site ;</li>
        <li><strong>Google</strong> — connexion via compte Google (si vous choisissez cette option) ;</li>
        <li><strong>Stripe</strong> — traitement des paiements d'abonnement ;</li>
        <li><strong>Cloudflare</strong> — protection anti-robot (Turnstile) à l'inscription.</li>
      </ul>

      <h2>6. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. En
        cas de suppression de votre compte, votre profil est anonymisé
        (prénom, nom, email et téléphone effacés) ; les contenus que vous
        avez publiés restent visibles, attribués à un « Compte supprimé »,
        afin de préserver la cohérence des échanges avec les autres
        utilisateurs.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de
        rectification, d'effacement, de limitation et de portabilité de
        vos données, ainsi que d'un droit d'opposition. Vous pouvez
        exercer ces droits :
      </p>
      <ul>
        <li>en modifiant vos informations depuis votre profil ("Modifier le profil") ;</li>
        <li>en supprimant votre compte directement depuis cette même page ;</li>
        <li>
          ou en nous contactant à{' '}
          <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">
            levoyagepourtous@gmail.com
          </a>{' '}
          pour toute autre demande (accès complet, portabilité...).
        </li>
      </ul>
      <p>
        Vous disposez également du droit d'introduire une réclamation
        auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne
        sont pas respectés.
      </p>

      <h2>8. Mineurs</h2>
      <p>
        Le site est réservé aux personnes majeures (18 ans et plus). Nous
        ne collectons pas sciemment de données concernant des mineurs.
      </p>

      <h2>9. Modification de cette politique</h2>
      <p>
        Cette politique de confidentialité peut être mise à jour. La date
        de dernière mise à jour figure en haut de cette page.
      </p>
    </LegalPageLayout>
  )
}
