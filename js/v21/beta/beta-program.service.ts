import { doc, setDoc, getDoc, collection, getDocs, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export interface BetaAgency {
  agencyId: string;
  name?: string;
  status: 'candidate' | 'invited' | 'active' | 'paused' | 'completed' | string;
  cohort?: string;
  notes?: string;
  createdAt?: string;
}

export async function saveBetaAgency(input: BetaAgency, options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'betaProgram' });
  const context = buildUserAgencyContext();

  const payload = {
    ...input,
    status: input.status || 'candidate',
    cohort: input.cohort || 'beta-v21',
    updatedAt: new Date().toISOString(),
    updatedBy: context.userId || ''
  };

  if (!db) {
    persistLocalBetaAgency(payload);
    return { ok: false, pendingSync: true, betaAgency: payload };
  }

  await setDoc(doc(db, 'betaProgram', input.agencyId), payload, { merge: true });
  persistLocalBetaAgency(payload);

  return { ok: true, betaAgency: payload };
}

export async function listBetaAgencies(options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'betaProgram' });
  if (!db) return readLocalBetaAgencies();

  const snap = await getDocs(collection(db, 'betaProgram'));
  return snap.docs.map((item) => ({ agencyId: item.id, ...item.data() }));
}

export async function getBetaAgency(agencyId: string, options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'betaProgram' });
  if (!db) return readLocalBetaAgencies().find((item: any) => item.agencyId === agencyId) || null;

  const snap = await getDoc(doc(db, 'betaProgram', agencyId));
  return snap.exists() ? { agencyId, ...snap.data() } : null;
}

export function persistLocalBetaAgency(payload: any) {
  if (typeof window === 'undefined') return;

  try {
    const rows = readLocalBetaAgencies().filter((item: any) => item.agencyId !== payload.agencyId);
    rows.unshift(payload);
    localStorage.setItem('gp:v21:betaAgencies', JSON.stringify(rows.slice(0, 100)));
  } catch (_) {
    // ignore
  }
}

export function readLocalBetaAgencies() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('gp:v21:betaAgencies');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}
