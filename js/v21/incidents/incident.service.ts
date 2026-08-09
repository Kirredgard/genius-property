import { addDoc, collection, getDocs, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export async function createIncident(input: any, options: { db?: Firestore | unknown } = {}) {
  const context = buildUserAgencyContext();
  const payload = {
    agencyId: context.agencyId || '',
    userId: context.userId || '',
    title: input.title || '',
    severity: input.severity || 'medium',
    status: input.status || 'open',
    description: input.description || '',
    createdAt: new Date().toISOString()
  };

  const db = resolveFirestore({ db: options.db, collectionName: 'incidents' });
  if (!db) {
    persistLocalIncident(payload);
    return { ok: false, pendingSync: true, incident: payload };
  }

  const ref = await addDoc(collection(db, 'incidents'), payload);
  persistLocalIncident({ id: ref.id, ...payload });
  return { ok: true, id: ref.id, incident: payload };
}

export async function listIncidents(options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'incidents' });
  if (!db) return readLocalIncidents();

  const snap = await getDocs(collection(db, 'incidents'));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function persistLocalIncident(payload: any) {
  const rows = readLocalIncidents();
  rows.unshift(payload);
  localStorage.setItem('gp:v21:incidents', JSON.stringify(rows.slice(0, 100)));
}

export function readLocalIncidents() {
  try {
    return JSON.parse(localStorage.getItem('gp:v21:incidents') || '[]');
  } catch (_) {
    return [];
  }
}
