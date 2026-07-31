import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function CGU() {
  return (
    <LegalPageLayout title="Conditions générales d'utilisation" updatedAt="31 juillet 2026">
      <p>
        Les présentes conditions générales d'utilisation (CGU) régissent
        l'accès et l'usage du site Le Voyage Pour Tous, édité par une
        entreprise individuelle (voir les{' '}
        <a href="/mentions-legales" className="text-coral hover:underline">mentions légales</a>).
        En créant un compte ou en utilisant le site, l'utilisateur accepte
        sans réserve les présentes CGU.
      </p>

      <h2>1. Objet du service</h2>
      <p>
        Le Voyage Pour Tous est un carnet de voyage numérique communautaire
        permettant de rechercher des vols et hébergements, de créer et
        consulter des itinéraires de voyage, et d'échanger des conseils,
        bons plans et alertes avec d'autres voyageurs (module Voyage
        Commun).
      </p>

      <h2>2. Âge minimum et création de compte</h2>
      <p>
        L'inscription est réservée aux personnes <strong>majeures (18 ans
        et plus)</strong>. En créant un compte, l'utilisateur certifie être
        majeur. L'inscription se fait par email et mot de passe, ou via un
        compte Google.
      </p>
      <p>
        L'utilisateur est responsable de la confidentialité de ses
        identifiants et de toute activité effectuée depuis son compte.
      </p>

      <h2>3. Contenus publiés par les utilisateurs</h2>
      <p>
        Certaines fonctionnalités (itinéraires, posts et commentaires
        Voyage Commun, propositions de fonctionnalités) permettent à
        l'utilisateur de publier du contenu visible par les autres
        membres. L'utilisateur s'engage à ne publier aucun contenu :
      </p>
      <ul>
        <li>illicite, diffamatoire, injurieux ou discriminatoire ;</li>
        <li>portant atteinte aux droits d'un tiers (image, propriété intellectuelle...) ;</li>
        <li>trompeur, notamment en signalant à tort une arnaque ou un mauvais plan ;</li>
        <li>contraire à l'ordre public.</li>
      </ul>
      <p>
        L'éditeur se réserve le droit de retirer, sans préavis, tout
        contenu contraire aux présentes CGU, et de suspendre ou supprimer
        le compte de son auteur en cas de manquement répété.
      </p>

      <h2>4. Système de vote et de fonctionnalités</h2>
      <p>
        Le site propose des mécanismes de vote sur les contenus publiés
        (itinéraires, posts Voyage Commun) ainsi qu'un système de
        proposition et de vote pour les prochaines fonctionnalités du
        site. Ces votes sont réservés à un usage personnel et loyal :
        toute tentative de manipulation (création de comptes multiples,
        échange de votes organisé) peut entraîner la suppression des
        votes concernés et, le cas échéant, du compte à l'origine de la
        manipulation.
      </p>

      <h2>5. Abonnements payants</h2>
      <p>
        Certaines fonctionnalités sont réservées aux utilisateurs disposant
        d'un abonnement payant. Les conditions tarifaires et de paiement
        sont détaillées dans les{' '}
        <a href="/cgv" className="text-coral hover:underline">conditions générales de vente</a>.
      </p>

      <h2>6. Liens et offres de partenaires</h2>
      <p>
        Le site peut afficher des liens de réservation vers des
        prestataires tiers (compagnies aériennes, plateformes
        d'hébergement, activités). Ces offres sont fournies à titre
        indicatif : l'éditeur ne garantit ni leur disponibilité, ni leur
        prix au moment de la réservation, ni la qualité du service rendu
        par le prestataire tiers. Toute réservation s'effectue directement
        auprès du prestataire, sous sa seule responsabilité.
      </p>

      <h2>7. Suppression de compte</h2>
      <p>
        L'utilisateur peut supprimer son compte à tout moment depuis son
        profil. Son profil est alors anonymisé (prénom, nom, email et
        téléphone effacés). Les contenus qu'il a publiés (itinéraires,
        posts, commentaires) restent visibles, mais affichés comme
        provenant d'un « Compte supprimé », afin de préserver la
        cohérence des échanges avec les autres utilisateurs.
      </p>

      <h2>8. Modification des CGU</h2>
      <p>
        L'éditeur se réserve le droit de modifier les présentes CGU à tout
        moment. La date de dernière mise à jour figure en haut de cette
        page. L'utilisation continue du site après modification vaut
        acceptation des nouvelles conditions.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU :{' '}
        <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">
          levoyagepourtous@gmail.com
        </a>
      </p>
    </LegalPageLayout>
  )
}
