import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { getCurrentAgencyId } from '../data/agency-context.js';
import { getPlanLimits, type PlanCode } from './plans.js';

export interface AgencySubscription {
  agencyId: string;
  plan: PlanCode | string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | string;
  currentPeriodEnd?: string;
  limits?: Record<string, unknown>;
}

export function getLocalSubscription(): AgencySubscription {
  if (typeof window === 'undefined') {
    return {
      agencyId: '',
      plan: 'free',
      status: 'trialing',
      limits: getPlanLimits('free') as any
    };
  }

  try {
    const raw = localStorage.getItem('gp:v21:subscription');
    if (raw) return JSON.parse(raw);
  } catch (_) {
    // ignore
  }

  const agencyId = getCurrentAgencyId();

  return {
    agencyId,
    plan: 'free',
    status: 'trialing',
    limits: getPlanLimits('free') as any
  };
}

export function persistLocalSubscription(subscription: AgencySubscription): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('gp:v21:subscription', JSON.stringify(subscription));
  (window as any).GPV21Subscription = subscription;
}

export async function loadAgencySubscription(options: { agencyId?: string; db?: Firestore | unknown } = {}): Promise<AgencySubscription> {
  const agencyId = options.agencyId || getCurrentAgencyId();
  const db = resolveFirestore({ db: options.db, collectionName: 'subscriptions' });

  if (!agencyId || !db) {
    const local = getLocalSubscription();
    persistLocalSubscription(local);
    return local;
  }

  const ref = doc(db, 'agencies', agencyId, 'settings', 'subscription');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const fallback = {
      agencyId,
      plan: 'free',
      status: 'trialing',
      limits: getPlanLimits('free') as any
    };
    persistLocalSubscription(fallback);
    return fallback;
  }

  const data = snap.data() as any;
  const subscription = {
    agencyId,
    plan: data.plan || 'free',
    status: data.status || 'trialing',
    currentPeriodEnd: data.currentPeriodEnd || '',
    limits: data.limits || getPlanLimits(data.plan || 'free')
  };

  persistLocalSubscription(subscription);
  return subscription;
}

export async function saveAgencySubscription(subscription: AgencySubscription, options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'subscriptions' });

  if (!db || !subscription.agencyId) {
    persistLocalSubscription(subscription);
    return { ok: false, reason: 'Firestore unavailable', subscription };
  }

  await setDoc(doc(db, 'agencies', subscription.agencyId, 'settings', 'subscription'), {
    ...subscription,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  persistLocalSubscription(subscription);
  return { ok: true, subscription };
}
