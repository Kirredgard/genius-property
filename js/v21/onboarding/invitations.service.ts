import { doc, setDoc, getDoc, updateDoc, collection, getDocs, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export interface InvitationInput {
  email: string;
  role: string;
  agencyId?: string;
}

export function generateInviteToken(_email: string): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('[V21][Invitations] Génération cryptographique du token indisponible.');
}

export async function createInvitation(input: InvitationInput, options: { db?: Firestore | unknown } = {}) {
  const context = buildUserAgencyContext();
  const agencyId = input.agencyId || context.agencyId;
  const db = resolveFirestore({ db: options.db, collectionName: 'invitations' });
  const token = generateInviteToken(input.email);

  if (!agencyId) {
    return { ok: false, reason: 'agencyId requis', invitation: null, inviteUrl: '' };
  }

  const invitation = {
    token,
    email: input.email.trim().toLowerCase(),
    role: input.role || 'viewer',
    agencyId,
    status: 'pending',
    invitedBy: context.userId,
    createdAt: new Date().toISOString()
  };

  if (!db) {
    return {
      ok: false,
      reason: 'Firestore unavailable',
      invitation,
      inviteUrl: buildInviteUrl(token)
    };
  }

  await setDoc(doc(db, 'agencies', agencyId, 'invitations', token), invitation);
  return {
    ok: true,
    invitation,
    inviteUrl: buildInviteUrl(token)
  };
}

export async function listInvitations(options: { agencyId?: string; db?: Firestore | unknown } = {}) {
  const context = buildUserAgencyContext();
  const agencyId = options.agencyId || context.agencyId;
  const db = resolveFirestore({ db: options.db, collectionName: 'invitations' });

  if (!db || !agencyId) return [];

  const snap = await getDocs(collection(db, 'agencies', agencyId, 'invitations'));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function acceptInvitation(
  token: string,
  user: { uid: string; email?: string },
  options: { agencyId?: string; db?: Firestore | unknown } = {}
) {
  if (!token) return { ok: false, errors: ['Token d’invitation requis'] };

  // Production path: the backend resolves the invitation by token and creates
  // the membership with Firebase Admin. This avoids granting invitees write
  // access to their own membership document.
  if (!options.db && typeof window !== 'undefined') {
    const { getFirebaseAuthHeaders } = await import('../auth/api-auth.js');
    const baseUrl = (window as any).GPV21_INVITATION_API_URL || import.meta.env.VITE_INVITATION_API_URL || '/api/invitations';
    const response = await fetch(`${baseUrl}/accept`, {
      method: 'POST',
      headers: await getFirebaseAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ token })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, errors: [payload.error || `Invitation impossible: ${response.status}`] };
    }

    return payload;
  }

  // Test/compatibility path for injected Firestore mocks.
  const db = resolveFirestore({ db: options.db, collectionName: 'invitations' });
  if (!db) return { ok: false, errors: ['Firestore unavailable'] };

  const agencyId = options.agencyId;
  if (!agencyId) return { ok: false, errors: ['agencyId requis'] };

  const ref = doc(db, 'agencies', agencyId, 'invitations', token);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, errors: ['Invitation introuvable'] };

  const invitation = snap.data() as any;
  if (invitation.status !== 'pending') return { ok: false, errors: ['Invitation déjà utilisée'] };
  if (invitation.email && user.email && invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, errors: ['Cette invitation est destinée à une autre adresse email'] };
  }

  await setDoc(doc(db, 'agencies', agencyId, 'members', user.uid), {
    userId: user.uid,
    email: user.email || invitation.email,
    role: invitation.role || 'viewer',
    agencyId,
    status: 'active',
    joinedAt: new Date().toISOString()
  }, { merge: true });

  await updateDoc(ref, {
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
    acceptedBy: user.uid
  });

  return { ok: true, agencyId, role: invitation.role };
}

export function buildInviteUrl(token: string): string {
  if (typeof window === 'undefined') return `/invite.v21.html?token=${encodeURIComponent(token)}`;
  return `${window.location.origin}/invite.v21.html?token=${encodeURIComponent(token)}`;
}
