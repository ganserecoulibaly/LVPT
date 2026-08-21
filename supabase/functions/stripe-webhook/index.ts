import { stripe } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

// IMPORTANT : cette fonction doit être déployée avec --no-verify-jwt
// (voir instructions de déploiement) car c'est Stripe qui l'appelle, pas un
// utilisateur connecté. La sécurité est assurée par la vérification de
// signature ci-dessous, pas par l'auth Supabase.

// Les valeurs stockées dans lvpt.abonnement doivent correspondre à
// PLAN_ORDER dans usePlanAccess.js et Sidebar.jsx ("free" | "occasional" |
// "frequent"), alors que Stripe (metadata.plan, PRICE_IDS dans
// _shared/stripe.ts) utilise "occasionnel" | "grand" côté checkout. Ce
// mapping fait le pont entre les deux.
const PLAN_MAP: Record<string, string> = {
  occasionnel: "occasional",
  grand: "frequent",
};

// Mapping inverse price_id → plan (valeurs anglaises), pour retrouver le
// plan quand on ne dispose que du price_id (ex: changement fait depuis le
// Billing Portal, où aucune metadata.plan n'est disponible côté webhook).
const PRICE_ID_TO_PLAN: Record<string, string> = {
  [Deno.env.get("STRIPE_PRICE_VOYAGEUR_MENSUEL")!]: "occasional",
  [Deno.env.get("STRIPE_PRICE_VOYAGEUR_ANNUEL")!]: "occasional",
  [Deno.env.get("STRIPE_PRICE_GRAND_MENSUEL")!]: "frequent",
  [Deno.env.get("STRIPE_PRICE_GRAND_ANNUEL")!]: "frequent",
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  if (!signature) {
    return new Response("Signature manquante", { status: 400 });
  }

  const body = await req.text();
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Signature webhook invalide :", err);
    return new Response("Signature invalide", { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    // Paiement initial validé → on active le plan choisi
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const pid = session.client_reference_id ?? session.metadata?.pid;
      const rawPlan = session.metadata?.plan; // "occasionnel" | "grand"
      const plan = PLAN_MAP[rawPlan] ?? rawPlan;

      if (pid && plan) {
        const { error } = await supabase
          .from("lvpt")
          .update({
            abonnement: plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            paiement_en_echec: false,
          })
          .eq("id", pid);

        if (error) console.error("Erreur mise à jour lvpt (checkout.session.completed) :", error);
      }
      break;
    }

    // Renouvellement, changement de statut, OU changement de plan fait
    // depuis le Billing Portal (Stripe envoie ce même événement dans les
    // trois cas). Si l'abonnement n'est plus actif → retour au Gratuit.
    // Si actif → on relit le price_id courant pour détecter un éventuel
    // changement de plan (upgrade/downgrade fait hors de change-subscription-plan)
    // et on met lvpt.abonnement à jour en conséquence.
    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      const isActive = ["active", "trialing"].includes(subscription.status);

      if (!isActive) {
        const { error } = await supabase
          .from("lvpt")
          .update({ abonnement: "free" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Erreur mise à jour lvpt (subscription.updated, inactif) :", error);
        break;
      }

      const currentPriceId = subscription.items.data[0]?.price?.id;
      const planFromPrice = currentPriceId ? PRICE_ID_TO_PLAN[currentPriceId] : undefined;

      const updatePayload: Record<string, unknown> = { paiement_en_echec: false };
      if (planFromPrice) {
        updatePayload.abonnement = planFromPrice;
      } else {
        console.warn("price_id inconnu dans subscription.updated :", currentPriceId);
      }

      const { error } = await supabase
        .from("lvpt")
        .update(updatePayload)
        .eq("stripe_subscription_id", subscription.id);

      if (error) console.error("Erreur mise à jour lvpt (subscription.updated, actif) :", error);
      break;
    }

    // Abonnement résilié (fin de période) → retour au plan Gratuit
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const { error } = await supabase
        .from("lvpt")
        .update({ abonnement: "free", paiement_en_echec: false })
        .eq("stripe_subscription_id", subscription.id);

      if (error) console.error("Erreur mise à jour lvpt (subscription.deleted) :", error);
      break;
    }

    // Échec de paiement d'un renouvellement → on lève le flag pour
    // afficher un bandeau d'alerte côté Dashboard.
    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const { error } = await supabase
          .from("lvpt")
          .update({ paiement_en_echec: true })
          .eq("stripe_subscription_id", invoice.subscription);

        if (error) console.error("Erreur mise à jour lvpt (payment_failed) :", error);
      }
      break;
    }

    // Paiement de facture réussi (renouvellement classique) → on lève
    // le flag au cas où un échec précédent avait été résolu.
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const { error } = await supabase
          .from("lvpt")
          .update({ paiement_en_echec: false })
          .eq("stripe_subscription_id", invoice.subscription);

        if (error) console.error("Erreur mise à jour lvpt (payment_succeeded) :", error);
      }
      break;
    }

    default:
      // Événement non traité explicitement, on l'ignore
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
