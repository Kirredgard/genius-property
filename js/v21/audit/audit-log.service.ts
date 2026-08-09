import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export interface AuditLogInput {
  action: string;
  entityType?: string;
  entityId?: string;
  level?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(
  input: AuditLogInput,
  options: { db?: Firestore | unknown } = {}
) {
  const context = buildUserAgencyContext();

  const payload = {
    agencyId: context.agencyId || '',
    userId: context.userId || '',
    role: context.role || 'viewer',
    action: input.action,
    entityType: input.entityType || '',
    entityId: input.entityId || '',
    level: input.level || 'info',
    metadata: input.metadata || {},
    createdAt: new Date().toISOString()
  };

  const db = resolveFirestore({ db: options.db, collectionName: 'auditLogs' });

  if (!db || !context.agencyId) {
    persistLocalAuditLog(payload);
    return { ok: false, pendingSync: true, payload };
  }

  await addDoc(collection(db, 'agencies', context.agencyId, 'auditLogs'), {
    ...payload,
    createdAtServer: serverTimestamp()
  });

  persistLocalAuditLog(payload);

  return { ok: true, payload };
}

export function persistLocalAuditLog(payload: any) {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem('gp:v21:auditLogs');
    const rows = raw ? JSON.parse(raw) : [];
    rows.unshift(payload);

    localStorage.setItem('gp:v21:auditLogs', JSON.stringify(rows.slice(0, 200)));
  } catch (_) {
    // ignore
  }
}

export function readLocalAuditLogs() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('gp:v21:auditLogs');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}
