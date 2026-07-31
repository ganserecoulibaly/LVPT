import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function CGV() {
  return (
    <LegalPageLayout title="Conditions générales de vente" updatedAt="31 juillet 2026">
      <p>
        Les présentes conditions générales de vente (CGV) s'appliquent à
        tout abonnement payant souscrit sur le site Le Voyage Pour Tous,
        édité par une entreprise individuelle (voir les{' '}
        <a href="/mentions-legales" className="text-coral hover:underline">mentions légales</a>).
      </p>

      <h2>1. Formules d'abonnement</h2>
      <p>Le site propose trois formules :</p>
      <ul>
        <li><strong>Gratuit</strong> — 0€, sans engagement.</li>
        <li><strong>Voyageur occasionnel</strong> — 4,90€/mois, ou 49€/an (soit environ 4,08€/mois).</li>
        <li><strong>Grand Voyageur</strong> — 8,90€/mois, ou 89€/an (soit environ 7,42€/mois).</li>
      </ul>
      <p className="text-navy/50 text-xs">
        [Ces montants sont ceux discutés à ce jour et pourront évoluer avant
        le lancement commercial définitif — à reconfirmer avant publication.]
      </p>

      <h2>2. Paiement</h2>
      <p>
        Les paiements sont traités par notre prestataire de paiement
        sécurisé, Stripe. Le site ne stocke à aucun moment les données
        bancaires de l'utilisateur — celles-ci sont saisies directement
        sur l'interface sécurisée de Stripe.
      </p>
      <p>
        L'abonnement mensuel ou annuel est renouvelé automatiquement à
        chaque échéance, sauf résiliation préalable par l'utilisateur.
      </p>

      <h2>3. Résiliation</h2>
      <p>
        L'utilisateur peut résilier son abonnement à tout moment depuis son
        profil. La résiliation prend effet à la fin de la période déjà
        payée : l'utilisateur conserve l'accès aux fonctionnalités de son
        plan jusqu'à cette date, puis son compte repasse automatiquement
        en formule Gratuit. Aucun remboursement au prorata n'est effectué
        pour la période en cours, sauf disposition légale contraire.
      </p>

      <h2>4. Droit de rétractation</h2>
      <p>
        Conformément à l'article L221-28 du Code de la consommation, le
        droit de rétractation ne s'applique pas aux contenus numériques
        fournis sur un support immatériel dont l'exécution a commencé
        après accord préalable exprès du consommateur, qui reconnaît
        ainsi renoncer à son droit de rétractation. En souscrivant à un
        abonnement payant et en accédant immédiatement aux fonctionnalités
        associées, l'utilisateur reconnaît expressément renoncer à ce
        droit pour la période souscrite.
      </p>

      <h2>5. Modification ou arrêt d'une formule</h2>
      <p>
        L'éditeur se réserve le droit de modifier le contenu ou le tarif
        des formules d'abonnement, ou de cesser de proposer une formule.
        Toute modification tarifaire ne s'applique qu'aux nouveaux
        abonnements ou aux renouvellements postérieurs à son entrée en
        vigueur, sauf accord contraire.
      </p>

      <h2>6. Programme de vote pour les fonctionnalités</h2>
      <p>
        L'accès au système de vote sur les prochaines fonctionnalités et à
        la proposition d'idées ne constitue pas un engagement contractuel
        de l'éditeur à développer une fonctionnalité donnée, quel que soit
        le résultat du vote.
      </p>

      <h2>7. Réclamations</h2>
      <p>
        Toute question ou réclamation relative à un paiement peut être
        adressée à :{' '}
        <a href="mailto:levoyagepourtous@gmail.com" className="text-coral hover:underline">
          levoyagepourtous@gmail.com
        </a>
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de
        litige, une solution amiable sera recherchée avant toute action
        judiciaire.
      </p>
    </LegalPageLayout>
  )
}
