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

      <h2>3. Souscription et début de période</h2>
      <p>La souscription devient effective après validation de la commande et confirmation du paiement par le prestataire de paiement. La période d'abonnement commence à la date d'activation indiquée lors de la souscription.</p>
      <p>Pour un abonnement mensuel, le prix du mois souscrit est dû dès le démarrage de la période. Pour un abonnement annuel, le prix de l'année souscrite est dû dès le démarrage de la période annuelle.</p>

      <h2>4. Paiement et renouvellement</h2>
      <p>Les paiements sont traités par Stripe. LVPT ne stocke pas les coordonnées complètes de carte bancaire.</p>
      <p>Les abonnements mensuels et annuels sont renouvelés automatiquement à chaque échéance, sauf résiliation préalable selon les modalités proposées par LVPT.</p>

      <h2>5. Résiliation et absence de remboursement prorata temporis</h2>
      <p>L'utilisateur peut résilier son abonnement à tout moment selon les modalités proposées dans son espace client. La résiliation empêche le renouvellement à l'échéance suivante et ne met pas fin à la période déjà commencée.</p>
      <p><strong>Exemple pour un abonnement mensuel :</strong> si un abonnement est souscrit le 2 du mois et résilié le 5, le mois d'abonnement déjà commencé reste dû et aucun remboursement prorata temporis n'est effectué pour les jours restant à courir. L'utilisateur conserve l'accès aux fonctionnalités payantes jusqu'à la fin de la période mensuelle déjà payée.</p>
      <p><strong>Abonnement annuel :</strong> le même principe s'applique à la période annuelle. Une résiliation en cours d'année empêche le renouvellement annuel suivant mais n'entraîne pas, à elle seule, le remboursement prorata temporis de l'année déjà commencée.</p>
      <p>Ces dispositions s'appliquent sous réserve des droits impératifs prévus par la loi, notamment du droit de rétractation lorsqu'il est applicable et des remboursements légalement exigibles.</p>

      <h2>6. Droit de rétractation</h2>
      <p>Lorsque le droit de rétractation légal s'applique à la souscription à distance, le consommateur dispose du délai prévu par la loi, en principe quatorze jours pour un contrat de prestation de services conclu à distance. Les modalités d'exercice et les effets de la rétractation sont communiqués avant ou au moment de la souscription.</p>
      <p>Lorsque l'exécution du service commence avant la fin du délai légal à la demande expresse du consommateur, les règles légales relatives à l'exécution anticipée et, le cas échéant, à la perte ou à la réduction du droit de rétractation s'appliquent. LVPT ne peut pas écarter par une clause générale les droits impératifs du consommateur.</p>

      <h2>7. Résiliation en ligne</h2>
      <p>Lorsque la loi impose une fonctionnalité de résiliation en ligne, LVPT met à disposition le parcours permettant au consommateur d'exercer sa résiliation selon les modalités légalement requises. La résiliation en ligne ne modifie pas les règles de facturation de la période déjà commencée, sous réserve des droits légaux applicables.</p>

      <h2>8. Garanties et réclamations</h2>
      <p>Les garanties légales applicables aux consommateurs demeurent applicables. Pour toute question ou réclamation, contactez <a href="mailto:EMAIL" className="text-coral hover:underline">EMAIL</a>.</p>

      <h2>9. Ateliers</h2>
      <p>Les futurs ateliers pourront faire l'objet d'une réservation et d'un paiement spécifiques. Leurs tarifs, modalités de réservation, conditions d'annulation, de report, de remboursement et, le cas échéant, conditions liées au format de l'atelier seront présentés avant toute commande. Tant que cette offre n'est pas ouverte à la vente, aucune réservation d'atelier n'est constituée par les présentes CGV.</p>

      <h2>10. Modification des offres</h2>
      <p>LVPT peut faire évoluer ses offres. Les modifications de prix ou de contenu d'un abonnement en cours sont soumises aux règles applicables et aux informations communiquées au client avant leur prise d'effet.</p>

      <h2>11. Médiation de la consommation</h2>
      <p>Lorsque la médiation de la consommation est applicable, les coordonnées du médiateur compétent seront communiquées conformément aux obligations légales. Cette section doit être complétée avec le médiateur effectivement choisi avant le lancement commercial concerné.</p>

      <h2>12. Droit applicable</h2>
      <p>Les présentes CGV sont soumises au droit français. Les consommateurs bénéficient des dispositions impératives qui leur sont applicables.</p>
    </LegalPageLayout>
  )
}
