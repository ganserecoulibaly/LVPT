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

// Alerte email immédiate en cas d'erreur dans le traitement d'un
// événement Stripe — sans ça, un webhook cassé passerait inaperçu
// jusqu'à ce qu'un utilisateur (ou toi) remarque un abonnement pas à
// jour en base. Best-effort : si l'envoi de l'alerte échoue, on logue
// seulement, on ne bloque jamais le traitement du webhook pour ça.
async function sendAdminAlert(subject: string, details: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LVPT Alertes <alertes@levoyagepourtous.com>",
        to: "levoyagepourtous@gmail.com",
        subject: `[LVPT] ${subject}`,
        text: details,
      }),
    });
  } catch (alertErr) {
    console.error("Échec de l'envoi de l'alerte admin :", alertErr);
  }
}

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
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const pid = session.client_reference_id ?? session.metadata?.pid;
      const rawPlan = session.metadata?.plan;
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

        if (error) {
          console.error("Erreur mise à jour lvpt (checkout.session.completed) :", error);
          await sendAdminAlert(
            "Erreur webhook — checkout.session.completed",
            `Impossible de mettre à jour lvpt pour l'utilisateur ${pid} (plan ${plan}).\n\nErreur : ${error.message}`
          );
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      const isActive = ["active", "trialing"].includes(subscription.status);

      if (!isActive) {
        const { error } = await supabase
          .from("lvpt")
          .update({ abonnement: "free" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Erreur mise à jour lvpt (subscription.updated, inactif) :", error);
          await sendAdminAlert(
            "Erreur webhook — subscription.updated (inactif)",
            `Impossible de repasser l'abonnement ${subscription.id} à free.\n\nErreur : ${error.message}`
          );
        }
        break;
      }

      const currentPriceId = subscription.items.data[0]?.price?.id;
      const planFromPrice = currentPriceId ? PRICE_ID_TO_PLAN[currentPriceId] : undefined;

      const updatePayload: Record<string, unknown> = { paiement_en_echec: false };
      if (planFromPrice) {
        updatePayload.abonnement = planFromPrice;
      } else {
        console.warn("price_id inconnu dans subscription.updated :", currentPriceId);
        await sendAdminAlert(
          "price_id inconnu — subscription.updated",
          `L'abonnement ${subscription.id} a un price_id (${currentPriceId}) qui ne correspond à aucun plan connu dans PRICE_ID_TO_PLAN. Vérifie si un nouveau tarif a été créé côté Stripe sans mettre à jour le mapping.`
        );
      }

      const { error } = await supabase
        .from("lvpt")
        .update(updatePayload)
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Erreur mise à jour lvpt (subscription.updated, actif) :", error);
        await sendAdminAlert(
          "Erreur webhook — subscription.updated (actif)",
          `Impossible de mettre à jour lvpt pour l'abonnement ${subscription.id}.\n\nErreur : ${error.message}`
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const { error } = await supabase
        .from("lvpt")
        .update({ abonnement: "free", paiement_en_echec: false })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Erreur mise à jour lvpt (subscription.deleted) :", error);
        await sendAdminAlert(
          "Erreur webhook — subscription.deleted",
          `Impossible de repasser l'abonnement ${subscription.id} à free après résiliation.\n\nErreur : ${error.message}`
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const { error } = await supabase
          .from("lvpt")
          .update({ paiement_en_echec: true })
          .eq("stripe_subscription_id", invoice.subscription);

        if (error) {
          console.error("Erreur mise à jour lvpt (payment_failed) :", error);
          await sendAdminAlert(
            "Erreur webhook — invoice.payment_failed",
            `Impossible de signaler l'échec de paiement pour l'abonnement ${invoice.subscription}.\n\nErreur : ${error.message}`
          );
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const { error } = await supabase
          .from("lvpt")
          .update({ paiement_en_echec: false })
          .eq("stripe_subscription_id", invoice.subscription);

        if (error) {
          console.error("Erreur mise à jour lvpt (payment_succeeded) :", error);
          await sendAdminAlert(
            "Erreur webhook — invoice.payment_succeeded",
            `Impossible de lever le flag paiement_en_echec pour l'abonnement ${invoice.subscription}.\n\nErreur : ${error.message}`
          );
        }
      }
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});