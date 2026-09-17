import React from 'react'
import LegalPageLayout from './LegalPageLayout'

export default function CGV() {
  return (
    <LegalPageLayout title="Conditions générales de vente" updatedAt="17 septembre 2026">
      <p>Les présentes CGV encadrent les ventes réalisées par Le Voyage Pour Tous (LVPT) auprès des consommateurs pour les offres payantes proposées sur le site.</p>

      <h2>1. Vendeur</h2>
      <p>Le vendeur est <strong>NOM PRÉNOM</strong>, entrepreneur individuel, éditeur et exploitant de LVPT. Les coordonnées complètes figurent dans les <a href="/mentions-legales" className="text-coral hover:underline">mentions légales</a>.</p>

      <h2>2. Offres et prix</h2>
      <p>Les fonctionnalités payantes, leurs prix, leur périodicité et leurs éventuelles conditions particulières sont présentés au moment de la souscription. Le prix applicable est celui affiché avant la validation de la commande.</p>
      <p>Les prix sont indiqués en euros. Le traitement fiscal applicable, notamment la TVA lorsqu'elle est due, est précisé lors de la commande.</p>

      <h2>3. Souscription</h2>
      <p>La souscription devient effective après validation de la commande et confirmation du paiement par le prestataire de paiement. L'utilisateur reçoit les informations relatives à son abonnement selon les modalités prévues par le service.</p>

      <h2>4. Paiement</h2>
      <p>Les paiements sont traités par Stripe. LVPT ne stocke pas les coordonnées complètes de carte bancaire.</p>
      <p>Pour un abonnement reconduit tacitement, le paiement est renouvelé selon la périodicité choisie jusqu'à sa résiliation.</p>

      <h2>5. Résiliation</h2>
      <p>L'utilisateur peut résilier son abonnement selon la fonctionnalité de résiliation proposée dans son espace client. Lorsque l'abonnement est payé pour une période déterminée, l'accès aux fonctionnalités payantes reste disponible jusqu'à l'échéance de la période déjà réglée, sauf disposition légale contraire.</p>

      <h2>6. Droit de rétractation</h2>
      <p>Lorsque le droit de rétractation est applicable, le consommateur dispose en principe d'un délai de quatorze jours à compter de la conclusion du contrat. Pour un service numérique dont l'exécution commence avant la fin de ce délai, les modalités relatives au consentement exprès du consommateur et à la perte éventuelle du droit de rétractation sont présentées au moment de la souscription conformément aux règles applicables.</p>

      <h2>7. Garanties et réclamations</h2>
      <p>Les garanties légales applicables aux consommateurs demeurent applicables. Pour toute question ou réclamation, contactez <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>

      <h2>8. Ateliers</h2>
      <p>Les futurs ateliers pourront faire l'objet d'une réservation et d'un paiement spécifiques. Leurs tarifs, modalités de réservation, conditions d'annulation, de report, de remboursement et, le cas échéant, conditions liées au format de l'atelier seront présentés avant toute commande. Tant que cette offre n'est pas ouverte à la vente, aucune réservation d'atelier n'est constituée par les présentes CGV.</p>

      <h2>9. Modification des offres</h2>
      <p>LVPT peut faire évoluer ses offres. Les modifications de prix ou de contenu d'un abonnement en cours sont soumises aux règles applicables et aux informations communiquées au client avant leur prise d'effet.</p>

      <h2>10. Médiation de la consommation</h2>
      <p>Lorsque la médiation de la consommation est applicable, les coordonnées du médiateur compétent seront communiquées conformément aux obligations légales. Cette section sera complétée avec les coordonnées du médiateur effectivement choisi avant le lancement commercial concerné.</p>

      <h2>11. Droit applicable</h2>
      <p>Les présentes CGV sont soumises au droit français. Les consommateurs bénéficient des dispositions impératives qui leur sont applicables.</p>
    </LegalPageLayout>
  )
}
