import { doc, getDoc, collectionGroup, query, where, getDocs, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { getPersistedSession, type AuthSession } from '../auth/auth.service.js';
import { persistUserAgencyContext, type UserAgencyContext } from '../context/user-agency-context.js';

export interface UserProfile {
  userId: string;
  email: string;
  agencyId: string;
  role: string;
  status: string;
  displayName?: string;
}

export async function loadUserProfile(
  session: AuthSession | null = getPersistedSession(),
  options: { db?: Firestore | unknown; agencyId?: string } = {}
): Promise<UserProfile | null> {
  if (!session?.uid) return null;

  const db = resolveFirestore({ db: options.db, collectionName: 'members' });
  if (!db) return null;

  if (options.agencyId) {
    const direct = await loadAgencyMemberProfile(session, options.agencyId, db);
    if (direct) return direct;
  }

  return findFirstMemberProfile(session, db);
}

export async function hydrateContextFromUserProfile(
  session: AuthSession | null = getPersistedSession(),
  options: { db?: Firestore | unknown; agencyId?: string } = {}
): Promise<UserAgencyContext> {
  const profile = await loadUserProfile(session, options);

  if (!profile) {
    return persistUserAgencyContext({
      user: session,
      userId: session?.uid || '',
      email: session?.email || '',
      role: 'viewer',
      agencyId: options.agencyId || ''
    });
  }

  return persistUserAgencyContext({
    user: session,
    userId: profile.userId,
    email: profile.email,
    agencyId: profile.agencyId,
    role: profile.role
  });
}

async function loadAgencyMemberProfile(session: AuthSession, agencyId: string, db: Firestore): Promise<UserProfile | null> {
  const ref = doc(db, 'agencies', agencyId, 'members', session.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return normalizeProfile(snap.data(), session, agencyId);
}

async function findFirstMemberProfile(session: AuthSession, db: Firestore): Promise<UserProfile | null> {
  const q = query(collectionGroup(db, 'members'), where('userId', '==', session.uid));
  const snaps = await getDocs(q);

  if (snaps.empty) return null;

  const first = snaps.docs[0];
  const parts = first.ref.path.split('/');
  const agencyIndex = parts.indexOf('agencies');
  const agencyId = agencyIndex >= 0 ? parts[agencyIndex + 1] : '';

  return normalizeProfile(first.data(), session, agencyId);
}

function normalizeProfile(data: any, session: AuthSession, agencyId: string): UserProfile {
  return {
    userId: data.userId || session.uid,
    email: data.email || session.email || '',
    agencyId: data.agencyId || agencyId,
    role: data.role || 'viewer',
    status: data.status || 'active',
    displayName: data.displayName || session.displayName || ''
  };
}
