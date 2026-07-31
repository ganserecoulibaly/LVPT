import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function MentionsLegales() {
  return (
    <LegalPageLayout title="Mentions légales" updatedAt="31 juillet 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site Le Voyage Pour Tous est édité par une entreprise individuelle,
        immatriculée sous le nom commercial <strong>Le Voyage Pour Tous</strong>.
      </p>
      <ul>
        <li><strong>Statut</strong> : entreprise individuelle</li>
        <li><strong>Adresse</strong> : 1 rue de Paris, 75001 Paris, France</li>
        <li><strong>SIRET</strong> : [SIRET À COMPLÉTER]</li>
        <li><strong>Email de contact</strong> : levoyagepourtous@gmail.com</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>
        Le directeur de la publication est le représentant légal de l'entreprise
        individuelle mentionnée ci-dessus.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
        91789, États-Unis. La base de données et l'authentification sont
        gérées par Supabase Inc., via son infrastructure cloud.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments constituant le site (textes, structure,
        identité visuelle, logo) sont, sauf mention contraire, la propriété
        de l'éditeur. Toute reproduction non autorisée est interdite.
      </p>
      <p>
        Les contenus publiés par les utilisateurs (itinéraires, conseils,
        commentaires, photos éventuelles) restent la propriété de leurs
        auteurs respectifs. En les publiant sur le site, l'utilisateur
        accorde à l'éditeur une licence non exclusive d'affichage dans le
        cadre du fonctionnement normal du service.
      </p>

      <h2>Signalement d'un contenu</h2>
      <p>
        Tout contenu jugé inapproprié, illicite ou contraire aux présentes
        mentions peut être signalé à l'adresse{' '}
        <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">
          levoyagepourtous@gmail.com
        </a>
        . L'éditeur se réserve le droit de le retirer sans préavis.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Le site présente des informations, prix et disponibilités (vols,
        hébergements, activités) fournis à titre indicatif. L'éditeur ne
        garantit pas leur exactitude en temps réel et invite l'utilisateur à
        vérifier chaque offre directement auprès du prestataire concerné
        avant toute réservation.
      </p>
    </LegalPageLayout>
  )
}
