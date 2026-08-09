import { doc, setDoc, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { getPersistedSession } from '../auth/auth.service.js';
import { persistUserAgencyContext } from '../context/user-agency-context.js';

export interface CreateAgencyInput {
  agencyId?: string;
  name: string;
  country?: string;
  city?: string;
}

export function generateAgencyId(name: string): string {
  const slug = String(name || 'agency')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'agency'}-${Date.now()}`;
}

export async function createAgency(input: CreateAgencyInput, options: { db?: Firestore | unknown } = {}) {
  const session = getPersistedSession();
  const db = resolveFirestore({ db: options.db, collectionName: 'agencies' });
  const agencyId = input.agencyId || generateAgencyId(input.name);

  const agency = {
    id: agencyId,
    name: input.name,
    country: input.country || '',
    city: input.city || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: session?.uid || ''
  };

  if (!db) {
    persistUserAgencyContext({
      agencyId,
      role: 'owner',
      user: session,
      userId: session?.uid || '',
      email: session?.email || ''
    });

    return {
      ok: false,
      reason: 'Firestore unavailable',
      agency,
      _pendingSync: true
    };
  }

  await setDoc(doc(db, 'agencies', agencyId), agency, { merge: true });

  if (session?.uid) {
    await setDoc(doc(db, 'agencies', agencyId, 'members', session.uid), {
      userId: session.uid,
      email: session.email || '',
      role: 'owner',
      status: 'active',
      agencyId,
      joinedAt: new Date().toISOString()
    }, { merge: true });
  }

  persistUserAgencyContext({
    agencyId,
    role: 'owner',
    user: session,
    userId: session?.uid || '',
    email: session?.email || ''
  });

  return {
    ok: true,
    agency
  };
}
