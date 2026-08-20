import { stripe } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

// IMPORTANT : cette fonction doit être déployée avec --no-verify-jwt
// (voir instructions de déploiement) car c'est Stripe qui l'appelle, pas un
// utilisateur connecté. La sécurité est assurée par la vérification de
// signature ci-dessous, pas par l'auth Supabase.

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
      const plan = session.metadata?.plan; // "occasionnel" | "grand"

      if (pid && plan) {
        const { error } = await supabase
          .from("lvpt")
          .update({
            abonnement: plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            abonnement_statut: "active",
          })
          .eq("pid", pid);

        if (error) console.error("Erreur mise à jour lvpt (checkout.session.completed) :", error);
      }
      break;
    }

    // Renouvellement, changement de statut (ex: retard de paiement résolu)
    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      const { error } = await supabase
        .from("lvpt")
        .update({ abonnement_statut: subscription.status })
        .eq("stripe_subscription_id", subscription.id);

      if (error) console.error("Erreur mise à jour lvpt (subscription.updated) :", error);
      break;
    }

    // Abonnement résilié (fin de période) → retour au plan Gratuit
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const { error } = await supabase
        .from("lvpt")
        .update({
          abonnement: "free",
          abonnement_statut: "canceled",
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) console.error("Erreur mise à jour lvpt (subscription.deleted) :", error);
      break;
    }

    // Échec de paiement d'un renouvellement
    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const { error } = await supabase
          .from("lvpt")
          .update({ abonnement_statut: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription);

        if (error) console.error("Erreur mise à jour lvpt (payment_failed) :", error);
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
