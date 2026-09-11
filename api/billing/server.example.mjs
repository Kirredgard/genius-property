import express from 'express';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { notifyBillingStatus, resolveBillingRecipient } from './email-notifications.js';
import {
  mapStripeStatus,
  extractPlanFromSubscription,
  getPeriodEndISO,
  buildSubscriptionPayload
} from './stripe-events.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const priceByPlan = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE
};

const planByPrice = Object.fromEntries(
  Object.entries(priceByPlan)
    .filter(([, price]) => Boolean(price))
    .map(([plan, price]) => [price, plan])
);

function subscriptionRef(agencyId) {
  return db.doc(`agencies/${agencyId}/settings/subscription`);
}

async function findSubscriptionDocsByStripeSubscription(subscriptionId) {
  return db.collectionGroup('settings')
    .where('subscriptionId', '==', subscriptionId)
    .get();
}



async function sendBillingEmailForSubscription({ agencyId, status, plan, customerEmail = '' }) {
  if (!agencyId || !process.env.EMAIL_API_URL) return;

  const ref = subscriptionRef(agencyId);
  const snap = await ref.get();
  const data = snap.data() || {};
  const to = resolveBillingRecipient(data, customerEmail);

  if (!to) return;

  await notifyBillingStatus({
    emailApiUrl: process.env.EMAIL_API_URL,
    to,
    agencyName: data.agencyName || agencyId,
    status,
    plan
  }).catch((error) => {
    console.warn('[Billing API] billing email failed:', error);
  });
}

async function updateSubscriptionByAgency(agencyId, payload) {
  if (!agencyId) return;
  await subscriptionRef(agencyId).set(payload, { merge: true });
}

async function updateSubscriptionByStripeSubscription(subscriptionId, payload) {
  const matches = await findSubscriptionDocsByStripeSubscription(subscriptionId);
  for (const doc of matches.docs) {
    await doc.ref.set(payload, { merge: true });
  }
}

app.post('/api/billing/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { agencyId, plan, successUrl, cancelUrl, email } = req.body || {};
    const price = priceByPlan[plan];

    if (!agencyId || !plan || !price) {
      return res.status(400).json({ error: 'agencyId, plan et price requis' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email || undefined,
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { agencyId, plan },
      subscription_data: {
        metadata: { agencyId, plan }
      }
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('[Billing API] checkout failed:', error);
    res.status(500).json({ error: 'checkout_failed' });
  }
});

app.post('/api/billing/create-portal-session', express.json(), async (req, res) => {
  try {
    const { agencyId, returnUrl } = req.body || {};
    const snap = await subscriptionRef(agencyId).get();
    const customerId = snap.data()?.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId introuvable' });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    res.json({ portalUrl: portal.url });
  } catch (error) {
    console.error('[Billing API] portal failed:', error);
    res.status(500).json({ error: 'portal_failed' });
  }
});

app.post('/api/billing/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const agencyId = session.metadata?.agencyId;
      const plan = session.metadata?.plan || 'free';
      const subscriptionId = String(session.subscription || '');
      const customerId = String(session.customer || '');

      await updateSubscriptionByAgency(agencyId, buildSubscriptionPayload({
        agencyId,
        plan,
        status: 'active',
        customerId,
        subscriptionId
      }));
      await sendBillingEmailForSubscription({ agencyId, status: 'active', plan, customerEmail: session.customer_details?.email || '' });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subscriptionId = String(invoice.subscription || '');

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const agencyId = subscription.metadata?.agencyId;
        const plan = extractPlanFromSubscription(subscription, planByPrice);

        const payload = buildSubscriptionPayload({
          agencyId,
          plan,
          status: mapStripeStatus(subscription.status),
          customerId: String(subscription.customer || ''),
          subscriptionId: subscription.id,
          currentPeriodEnd: getPeriodEndISO(subscription)
        });

        if (agencyId) {
          await updateSubscriptionByAgency(agencyId, payload);
          await sendBillingEmailForSubscription({ agencyId, status: payload.status, plan, customerEmail: invoice.customer_email || '' });
        } else await updateSubscriptionByStripeSubscription(subscriptionId, payload);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = String(invoice.subscription || '');

      if (subscriptionId) {
        await updateSubscriptionByStripeSubscription(subscriptionId, {
          status: 'past_due',
          updatedAt: new Date().toISOString()
        });

        // payment_failed notification: if agencyId is available in subscription metadata, send email.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const agencyId = subscription.metadata?.agencyId;
        if (agencyId) await sendBillingEmailForSubscription({ agencyId, status: 'past_due', plan: subscription.metadata?.plan || 'unknown', customerEmail: invoice.customer_email || '' });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const agencyId = subscription.metadata?.agencyId;
      const plan = extractPlanFromSubscription(subscription, planByPrice);

      const payload = buildSubscriptionPayload({
        agencyId,
        plan,
        status: mapStripeStatus(subscription.status),
        customerId: String(subscription.customer || ''),
        subscriptionId: subscription.id,
        currentPeriodEnd: getPeriodEndISO(subscription)
      });

      if (agencyId) await updateSubscriptionByAgency(agencyId, payload);
      else await updateSubscriptionByStripeSubscription(subscription.id, payload);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const agencyId = subscription.metadata?.agencyId;

      const payload = buildSubscriptionPayload({
        agencyId,
        plan: 'free',
        status: 'cancelled',
        customerId: String(subscription.customer || ''),
        subscriptionId: subscription.id,
        currentPeriodEnd: getPeriodEndISO(subscription)
      });

      if (agencyId) await updateSubscriptionByAgency(agencyId, payload);
      else await updateSubscriptionByStripeSubscription(subscription.id, payload);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Billing API] webhook processing failed:', error);
    res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

app.listen(process.env.PORT || 8787, () => {
  console.log('Billing API listening');
});
