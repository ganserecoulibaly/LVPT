import Stripe from 'npm:stripe@17.4.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// IMPORTANT : cette fonction doit être déployée sans vérification JWT
// (verify_jwt: false) car c'est Stripe qui l'appelle, pas un utilisateur
// connecté. La sécurité est assurée par la vérification de signature
// ci-dessous, pas par l'auth Supabase.

// Clients Stripe et Supabase admin (anciennement dans _shared/).
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2026-07-29.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
});

function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Les valeurs stockées dans lvpt.abonnement doivent correspondre à
// PLAN_ORDER dans usePlanAccess.js et Sidebar.jsx ('free' | 'occasional' |
// 'frequent'), alors que Stripe (metadata.plan, PRICE_IDS) utilise
// 'occasionnel' | 'grand' côté checkout. Ce mapping fait le pont entre les deux.
const PLAN_MAP: Record<string, string> = {
  occasionnel: 'occasional',
  grand: 'frequent',
};

// Mapping inverse price_id → plan (valeurs anglaises), pour retrouver le
// plan quand on ne dispose que du price_id (ex: changement fait depuis le
// Billing Portal, où aucune metadata.plan n'est disponible côté webhook).
const PRICE_ID_TO_PLAN: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_VOYAGEUR_MENSUEL')!]: 'occasional',
  [Deno.env.get('STRIPE_PRICE_VOYAGEUR_ANNUEL')!]: 'occasional',
  [Deno.env.get('STRIPE_PRICE_GRAND_MENSUEL')!]: 'frequent',
  [Deno.env.get('STRIPE_PRICE_GRAND_ANNUEL')!]: 'frequent',
};

const PLAN_LABELS: Record<string, string> = {
  occasional: 'Voyageur occasionnel',
  frequent: 'Grand Voyageur',
};

// ---------------------------------------------------------------------
// Notifications push ntfy (serveur auto-hébergé).
// Best-effort : ne bloque jamais le traitement d'un événement Stripe, et
// ne fait rien si NTFY_URL / NTFY_TOKEN sont absents.
// Topics : lvpt-business (normal), lvpt-urgent (priorité haute).
// ---------------------------------------------------------------------
async function notifyAdmin(
  topic: string,
  title: string,
  message: string,
  priority = 3
): Promise<void> {
  const baseUrl = Deno.env.get('NTFY_URL');
  const token = Deno.env.get('NTFY_TOKEN');
  if (!baseUrl || !token) return;

  try {
    const res = await fetch(baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, title, message, priority }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('ntfy a répondu', res.status, await res.text());
  } catch (err) {
    console.error(`Échec de l'envoi ntfy :`, err);
  }
}

// 'Prénom Nom (email)' avec uniquement ce qui est connu.
function describePerson(
  prenom?: string | null,
  nom?: string | null,
  email?: string | null
): string {
  const name = [prenom, nom].filter((v) => v && v.trim()).join(' ');
  if (name && email) return `${name} (${email})`;
  return name || email || 'Utilisateur inconnu';
}

function formatAmount(
  cents: number | null | undefined,
  currency: string | null | undefined
): string {
  if (cents === null || cents === undefined) return 'montant inconnu';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (currency || 'eur').toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ''}`.trim();
  }
}

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}

function intervalLabel(interval?: string | null): string {
  if (interval === 'month') return 'mensuel';
  if (interval === 'year') return 'annuel';
  return '';
}

function planLabelFromPrice(priceId?: string | null): string {
  if (!priceId) return 'plan inconnu';
  const plan = PRICE_ID_TO_PLAN[priceId];
  return plan ? (PLAN_LABELS[plan] ?? plan) : 'plan inconnu';
}

// Retrouve la personne : d'abord dans la table lvpt (id, abonnement ou client
// Stripe), puis en repli dans le client Stripe. Ne remonte que ce qui est connu.
async function findPerson(
  supabase: any,
  keys: { pid?: string | null; subscriptionId?: string | null; customerId?: string | null },
  fallbackEmail?: string | null
): Promise<string> {
  try {
    const attempts: Array<[string, string | null | undefined]> = [
      ['id', keys.pid],
      ['stripe_subscription_id', keys.subscriptionId],
      ['stripe_customer_id', keys.customerId],
    ];
    for (const [column, value] of attempts) {
      if (!value) continue;
      const { data } = await supabase
        .from('lvpt')
        .select('prenom, nom, email')
        .eq(column, value)
        .limit(1)
        .maybeSingle();
      if (data && (data.prenom || data.nom || data.email)) {
        return describePerson(data.prenom, data.nom, data.email);
      }
    }
    if (keys.customerId) {
      const customer: any = await stripe.customers.retrieve(keys.customerId);
      if (customer && !customer.deleted && (customer.name || customer.email)) {
        return describePerson(customer.name, null, customer.email ?? fallbackEmail);
      }
    }
  } catch (err) {
    console.warn('Recherche de la personne impossible :', err);
  }
  return describePerson(null, null, fallbackEmail);
}

// Code promo utilisé lors du checkout (best-effort : null si introuvable).
async function getPromoCode(sessionId: string): Promise<string | null> {
  try {
    const s: any = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['total_details.breakdown'],
    });
    const discount = s.total_details?.breakdown?.discounts?.[0]?.discount;
    const promo =
      discount?.promotion_code ?? discount?.source?.promotion_code ?? s.discounts?.[0]?.promotion_code;
    if (!promo) return null;
    if (typeof promo === 'object') return promo.code ?? null;
    const p: any = await stripe.promotionCodes.retrieve(promo);
    return p.code ?? null;
  } catch (err) {
    console.warn('Code promo introuvable :', err);
    return null;
  }
}

// Alerte immédiate en cas d'erreur dans le traitement d'un événement Stripe —
// sans ça, un webhook cassé passerait inaperçu jusqu'à ce qu'un utilisateur
// (ou toi) remarque un abonnement pas à jour en base. Email + notification ntfy.
// Best-effort : on ne bloque jamais le traitement du webhook pour ça.
async function sendAdminAlert(subject: string, details: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LVPT Alertes <alertes@levoyagepourtous.com>',
        to: 'levoyagepourtous@gmail.com',
        subject: `[LVPT] ${subject}`,
        text: details,
      }),
    });
  } catch (alertErr) {
    console.error(`Échec de l'envoi de l'alerte admin :`, alertErr);
  }
  await notifyAdmin('lvpt-urgent', subject, details.slice(0, 300), 4);
}

// Email de bienvenue au client, envoyé à chaque première souscription
// ET à chaque changement de plan payant↔payant (voir change-subscription-plan).
// Best-effort : un échec d'envoi n'empêche jamais la mise à jour du plan.
async function sendWelcomeToPlanEmail(toEmail: string, planLabel: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Le Voyage Pour Tous <noreply@levoyagepourtous.com>',
        to: toEmail,
        subject: `Bienvenue sur ${planLabel} !`,
        text: `Bonjour,\n\nTon abonnement ${planLabel} est maintenant actif. Tu as désormais accès à toutes les fonctionnalités de ce plan sur Le Voyage Pour Tous.\n\nBon voyage !\nL'équipe Le Voyage Pour Tous`,
      }),
    });
    if (!res.ok) {
      console.error(`Email de bienvenue refusé par Resend :`, res.status);
      await notifyAdmin(
        'lvpt-urgent',
        `Échec email de bienvenue`,
        `Resend a refusé l'envoi à ${toEmail} (HTTP ${res.status}).`,
        4
      );
    }
  } catch (emailErr) {
    console.error(`Échec de l'envoi de l'email de bienvenue :`, emailErr);
    await notifyAdmin(
      'lvpt-urgent',
      `Échec email de bienvenue`,
      `Erreur lors de l'envoi à ${toEmail}.`,
      4
    );
  }
}

// ---------------------------------------------------------------------
// Paiement d'un atelier (mode 'payment', metadata.type === 'atelier') :
// réservation passée à 'paye', e-mail de confirmation au client, et
// notification ntfy (lvpt-business). Idempotent : Stripe peut renvoyer
// l'événement, on ne notifie / n'écrit qu'une seule fois.
// ---------------------------------------------------------------------
async function handleAtelierPaid(supabase: any, session: any) {
  const pid = session.client_reference_id ?? session.metadata?.pid;
  const atelierId = session.metadata?.atelier_id;

  if (!pid || !atelierId) {
    await sendAdminAlert(
      'Paiement atelier sans pid ou atelier — checkout.session.completed',
      `La session ${session.id} est un paiement d'atelier mais client_reference_id / metadata.atelier_id sont manquants.`
    );
    return;
  }

  const { data: existing } = await supabase
    .from('s_atelier_reservation')
    .select('id_reservation, statut_paiement')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing?.statut_paiement === 'paye') return; // déjà traité

  if (existing) {
    const { error } = await supabase
      .from('s_atelier_reservation')
      .update({ statut_paiement: 'paye' })
      .eq('id_reservation', existing.id_reservation);
    if (error) {
      await sendAdminAlert(
        'Erreur webhook — réservation atelier',
        `Impossible de passer la réservation ${existing.id_reservation} à "paye" (session ${session.id}).\n\nErreur : ${error.message}`
      );
    }
  } else {
    const { error } = await supabase.from('s_atelier_reservation').insert({
      pid,
      id_atelier: atelierId,
      statut_paiement: 'paye',
      stripe_session_id: session.id,
    });
    if (error) {
      await sendAdminAlert(
        'Erreur webhook — réservation atelier',
        `Impossible de créer la réservation (session ${session.id}, pid ${pid}).\n\nErreur : ${error.message}`
      );
    }
  }

  const { data: atelier } = await supabase
    .from('d_atelier')
    .select('titre')
    .eq('id_atelier', atelierId)
    .maybeSingle();
  const titre = atelier?.titre ?? 'Atelier';
  const email = session.customer_details?.email;

  // E-mail de confirmation au client (best-effort)
  if (email) {
    try {
      const appUrl = Deno.env.get('APP_URL') ?? 'https://levoyagepourtous.com';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Le Voyage Pour Tous <noreply@levoyagepourtous.com>',
          to: email,
          subject: `Ton atelier est réservé : ${titre}`,
          text: `Bonjour,\n\nMerci, ton paiement est bien reçu : tu es inscrit à l'atelier « ${titre} ».\n\nSi tu n'as pas encore choisi ta date, tu peux le faire ici :\n${appUrl}/ateliers/confirmation?session_id=${session.id}\n\nTu recevras aussi un e-mail avec le lien de la visio une fois ta date choisie.\n\nÀ très vite,\nL'équipe Le Voyage Pour Tous`,
        }),
      });
      if (res.ok) {
        await supabase
          .from('s_atelier_reservation')
          .update({ email_confirmation_envoye: true })
          .eq('stripe_session_id', session.id);
      } else {
        await notifyAdmin(
          'lvpt-urgent',
          'Échec email atelier',
          `Resend a refusé l'envoi à ${email} (HTTP ${res.status}).`,
          4
        );
      }
    } catch (err) {
      console.error(`Échec de l'envoi de l'email atelier :`, err);
      await notifyAdmin('lvpt-urgent', 'Échec email atelier', `Erreur lors de l'envoi à ${email}.`, 4);
    }
  }

  const person = await findPerson(supabase, { pid, customerId: session.customer }, email);
  await notifyAdmin(
    'lvpt-business',
    'Atelier payé',
    [person, titre, formatAmount(session.amount_total, session.currency)].join('\n'),
    3
  );
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  if (!signature) {
    return new Response('Signature manquante', { status: 400 });
  }

  const body = await req.text();
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Signature webhook invalide :', err);
    return new Response('Signature invalide', { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    // Paiement initial validé → on active le plan choisi
    case 'checkout.session.completed': {
      const session = event.data.object as any;

      // Paiement unique d'un atelier : traitement séparé des abonnements
      if (session.metadata?.type === 'atelier') {
        await handleAtelierPaid(supabase, session);
        break;
      }

      const pid = session.client_reference_id ?? session.metadata?.pid;
      const rawPlan = session.metadata?.plan; // 'occasionnel' | 'grand'
      const plan = PLAN_MAP[rawPlan] ?? rawPlan;

      if (pid && plan) {
        const { error } = await supabase
          .from('lvpt')
          .update({
            abonnement: plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            paiement_en_echec: false,
          })
          .eq('id', pid);

        if (error) {
          console.error('Erreur mise à jour lvpt (checkout.session.completed) :', error);
          await sendAdminAlert(
            'Erreur webhook — checkout.session.completed',
            `Impossible de mettre à jour lvpt pour l'utilisateur ${pid} (plan ${plan}).\n\nErreur : ${error.message}`
          );
        } else if (session.customer_details?.email && PLAN_LABELS[plan]) {
          await sendWelcomeToPlanEmail(session.customer_details.email, PLAN_LABELS[plan]);
        }

        // Notification : nouvel abonné (+ code promo éventuel)
        const billingLabel =
          session.metadata?.billing === 'yearly'
            ? 'annuel'
            : session.metadata?.billing === 'monthly'
              ? 'mensuel'
              : '';
        const hasDiscount = (session.total_details?.amount_discount ?? 0) > 0;
        const promo = hasDiscount ? await getPromoCode(session.id) : null;
        const promoText = hasDiscount ? ` (code promo : ${promo ?? 'inconnu'})` : '';
        const person = await findPerson(
          supabase,
          { pid, customerId: session.customer },
          session.customer_details?.email
        );
        await notifyAdmin(
          'lvpt-business',
          'Nouvel abonné',
          [
            person,
            [PLAN_LABELS[plan] ?? plan, billingLabel].filter(Boolean).join(' — '),
            `${formatAmount(session.amount_total, session.currency)}${promoText}`,
          ].join('\n'),
          3
        );
      } else {
        await sendAdminAlert(
          'Paiement reçu sans pid ou plan — checkout.session.completed',
          `La session ${session.id} est terminée mais client_reference_id / metadata.plan sont manquants : aucun plan n'a été activé.`
        );
      }
      break;
    }

    // Renouvellement, changement de statut, OU changement de plan fait
    // depuis le Billing Portal (Stripe envoie ce même événement dans les
    // trois cas). Si l'abonnement n'est plus actif → retour au Gratuit.
    // Si actif → on relit le price_id courant pour détecter un éventuel
    // changement de plan et on met lvpt.abonnement à jour en conséquence.
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const previous = (event.data as any).previous_attributes ?? {};
      const isActive = ['active', 'trialing'].includes(subscription.status);

      if (!isActive) {
        const { error } = await supabase
          .from('lvpt')
          .update({ abonnement: 'free' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Erreur mise à jour lvpt (subscription.updated, inactif) :', error);
          await sendAdminAlert(
            'Erreur webhook — subscription.updated (inactif)',
            `Impossible de repasser l'abonnement ${subscription.id} à free.\n\nErreur : ${error.message}`
          );
        }

        // 'canceled' est déjà couvert par customer.subscription.deleted
        if (subscription.status !== 'canceled') {
          const person = await findPerson(supabase, {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
          });
          await notifyAdmin(
            'lvpt-urgent',
            'Abonnement désactivé',
            `${person}\nStatut Stripe : ${subscription.status}\nRetour au plan Gratuit`,
            4
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
        console.warn('price_id inconnu dans subscription.updated :', currentPriceId);
        await sendAdminAlert(
          'price_id inconnu — subscription.updated',
          `L'abonnement ${subscription.id} a un price_id (${currentPriceId}) qui ne correspond à aucun plan connu dans PRICE_ID_TO_PLAN. Vérifie si un nouveau tarif a été créé côté Stripe sans mettre à jour le mapping.`
        );
      }

      const { error } = await supabase
        .from('lvpt')
        .update(updatePayload)
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Erreur mise à jour lvpt (subscription.updated, actif) :', error);
        await sendAdminAlert(
          'Erreur webhook — subscription.updated (actif)',
          `Impossible de mettre à jour lvpt pour l'abonnement ${subscription.id}.\n\nErreur : ${error.message}`
        );
      }

      // Notifications : changement de plan / résiliation demandée / résiliation annulée
      const previousPriceId = previous.items?.data?.[0]?.price?.id;
      const planChanged = Boolean(
        previousPriceId && currentPriceId && previousPriceId !== currentPriceId
      );
      const cancelRequested =
        previous.cancel_at_period_end === false && subscription.cancel_at_period_end === true;
      const cancelReverted =
        previous.cancel_at_period_end === true && subscription.cancel_at_period_end === false;

      if (planChanged || cancelRequested || cancelReverted) {
        const person = await findPerson(supabase, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        const interval = intervalLabel(subscription.items?.data?.[0]?.price?.recurring?.interval);

        if (planChanged) {
          await notifyAdmin(
            'lvpt-business',
            'Changement de plan',
            `${person}\n${planLabelFromPrice(previousPriceId)} → ${planLabelFromPrice(currentPriceId)}${interval ? ` (${interval})` : ''}`,
            3
          );
        }
        if (cancelRequested) {
          const endDate = formatDate(
            subscription.cancel_at ??
              subscription.items?.data?.[0]?.current_period_end ??
              subscription.current_period_end
          );
          await notifyAdmin(
            'lvpt-business',
            'Résiliation demandée',
            `${person}\n${planLabelFromPrice(currentPriceId)}${endDate ? `\nFin de l'abonnement le ${endDate}` : ''}`,
            3
          );
        }
        if (cancelReverted) {
          await notifyAdmin(
            'lvpt-business',
            'Résiliation annulée',
            `${person}\n${planLabelFromPrice(currentPriceId)}\nL'abonnement continue.`,
            3
          );
        }
      }
      break;
    }

    // Abonnement résilié (fin de période) → retour au plan Gratuit
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      const { error } = await supabase
        .from('lvpt')
        .update({ abonnement: 'free', paiement_en_echec: false })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Erreur mise à jour lvpt (subscription.deleted) :', error);
        await sendAdminAlert(
          'Erreur webhook — subscription.deleted',
          `Impossible de repasser l'abonnement ${subscription.id} à free après résiliation.\n\nErreur : ${error.message}`
        );
      }

      const person = await findPerson(supabase, {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      });
      await notifyAdmin(
        'lvpt-business',
        'Abonnement terminé',
        `${person}\n${planLabelFromPrice(subscription.items?.data?.[0]?.price?.id)}\nRetour au plan Gratuit`,
        3
      );
      break;
    }

    // Échec de paiement d'un renouvellement → on lève le flag pour
    // afficher un bandeau d'alerte côté Dashboard.
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      // Selon la version d'API, l'abonnement est dans invoice.subscription ou
      // dans invoice.parent.subscription_details.subscription.
      const subId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription;

      if (subId) {
        const { error } = await supabase
          .from('lvpt')
          .update({ paiement_en_echec: true })
          .eq('stripe_subscription_id', subId);

        if (error) {
          console.error('Erreur mise à jour lvpt (payment_failed) :', error);
          await sendAdminAlert(
            'Erreur webhook — invoice.payment_failed',
            `Impossible de signaler l'échec de paiement pour l'abonnement ${subId}.\n\nErreur : ${error.message}`
          );
        }
      }

      const person = await findPerson(
        supabase,
        { subscriptionId: subId, customerId: invoice.customer },
        invoice.customer_email
      );
      await notifyAdmin(
        'lvpt-urgent',
        'Paiement échoué',
        `${person}\n${formatAmount(invoice.amount_due, invoice.currency)}${invoice.attempt_count ? ` — tentative ${invoice.attempt_count}` : ''}`,
        4
      );
      break;
    }

    // Paiement de facture réussi (renouvellement classique) → on lève
    // le flag au cas où un échec précédent avait été résolu.
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      const subId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription;

      if (subId) {
        const { error } = await supabase
          .from('lvpt')
          .update({ paiement_en_echec: false })
          .eq('stripe_subscription_id', subId);

        if (error) {
          console.error('Erreur mise à jour lvpt (payment_succeeded) :', error);
          await sendAdminAlert(
            'Erreur webhook — invoice.payment_succeeded',
            `Impossible de lever le flag paiement_en_echec pour l'abonnement ${subId}.\n\nErreur : ${error.message}`
          );
        }
      }
      break;
    }

    // Page de paiement non terminée (expire au bout de 24 h) : si c'est un
    // atelier, la réservation « en_attente » passe à « echoue ».
    case 'checkout.session.expired': {
      const session = event.data.object as any;
      if (session.metadata?.type === 'atelier') {
        const { error } = await supabase
          .from('s_atelier_reservation')
          .update({ statut_paiement: 'echoue' })
          .eq('stripe_session_id', session.id)
          .eq('statut_paiement', 'en_attente');
        if (error) console.error('Réservation expirée non mise à jour :', error);
      }
      break;
    }

    // Remboursement (total ou partiel)
    case 'charge.refunded': {
      const charge = event.data.object as any;

      // Remboursement COMPLET d'un atelier : la réservation passe à « rembourse ».
      // Le paiement d'atelier est retrouvé via sa session Checkout.
      let atelierMention = '';
      if (charge.refunded && charge.payment_intent) {
        try {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: charge.payment_intent,
            limit: 1,
          });
          const sess: any = sessions.data[0];
          if (sess?.metadata?.type === 'atelier') {
            const { data: maj, error: majErr } = await supabase
              .from('s_atelier_reservation')
              .update({ statut_paiement: 'rembourse' })
              .eq('stripe_session_id', sess.id)
              .select('id_atelier');
            if (majErr) console.error('Statut remboursé non enregistré :', majErr);
            else if (maj?.length) atelierMention = '\nRéservation d\'atelier passée à « remboursé »';
          }
        } catch (err) {
          console.error('Recherche de la session du remboursement :', err);
        }
      }

      const person = await findPerson(
        supabase,
        { customerId: charge.customer },
        charge.billing_details?.email ?? charge.receipt_email
      );
      await notifyAdmin(
        'lvpt-business',
        'Remboursement',
        `${person}\n${formatAmount(charge.amount_refunded, charge.currency)} remboursés sur ${formatAmount(charge.amount, charge.currency)}${atelierMention}`,
        3
      );
      break;
    }

    // Litige ouvert par un client auprès de sa banque
    case 'charge.dispute.created': {
      const dispute = event.data.object as any;
      let customerId: string | null = null;
      let email: string | null = null;
      try {
        const charge: any = await stripe.charges.retrieve(dispute.charge);
        customerId = charge.customer ?? null;
        email = charge.billing_details?.email ?? charge.receipt_email ?? null;
      } catch (err) {
        console.warn('Charge du litige introuvable :', err);
      }
      const person = await findPerson(supabase, { customerId }, email);
      const due = formatDate(dispute.evidence_details?.due_by);
      await notifyAdmin(
        'lvpt-urgent',
        'Litige Stripe',
        `${person}\n${formatAmount(dispute.amount, dispute.currency)} — motif : ${dispute.reason ?? 'inconnu'}${due ? `\nRéponse à fournir avant le ${due}` : ''}`,
        4
      );
      break;
    }

    default:
      // Événement non traité explicitement, on l'ignore
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
