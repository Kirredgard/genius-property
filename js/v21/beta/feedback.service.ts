import { addDoc, collection, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export interface FeedbackInput {
  type: 'bug' | 'idea' | 'question' | 'praise' | string;
  message: string;
  page?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
}

export async function submitFeedback(input: FeedbackInput, options: { db?: Firestore | unknown } = {}) {
  const context = buildUserAgencyContext();

  const payload = {
    agencyId: context.agencyId || '',
    userId: context.userId || '',
    email: context.email || '',
    type: input.type || 'idea',
    severity: input.severity || 'medium',
    message: input.message,
    page: input.page || (typeof location !== 'undefined' ? location.pathname : ''),
    createdAt: new Date().toISOString()
  };

  const db = resolveFirestore({ db: options.db, collectionName: 'feedback' });

  if (!db) {
    persistLocalFeedback(payload);
    return { ok: false, pendingSync: true, feedback: payload };
  }

  await addDoc(collection(db, 'feedback'), payload);
  persistLocalFeedback(payload);

  return { ok: true, feedback: payload };
}

export function persistLocalFeedback(payload: any) {
  if (typeof window === 'undefined') return;

  try {
    const rows = readLocalFeedback();
    rows.unshift(payload);
    localStorage.setItem('gp:v21:feedback', JSON.stringify(rows.slice(0, 100)));
  } catch (_) {
    // ignore
  }
}

export function readLocalFeedback() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('gp:v21:feedback');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}
