import { collection, getDocs, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';

export async function listAgencySubscriptions(options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'agencies' });
  if (!db) return [];

  const agenciesSnap = await getDocs(collection(db, 'agencies'));
  const rows = [];

  for (const agency of agenciesSnap.docs) {
    const subscriptionSnap = await getDocs(collection(db, 'agencies', agency.id, 'settings'));
    const subscriptionDoc = subscriptionSnap.docs.find((doc) => doc.id === 'subscription');

    if (subscriptionDoc) {
      rows.push({
        agencyId: agency.id,
        ...subscriptionDoc.data()
      });
    }
  }

  return rows;
}

export async function listAgencyUsage(options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'agencies' });
  if (!db) return [];

  const agenciesSnap = await getDocs(collection(db, 'agencies'));
  const rows = [];

  for (const agency of agenciesSnap.docs) {
    const [properties, tenants, documents, members] = await Promise.all([
      getDocs(collection(db, 'agencies', agency.id, 'properties')),
      getDocs(collection(db, 'agencies', agency.id, 'tenants')),
      getDocs(collection(db, 'agencies', agency.id, 'documents')),
      getDocs(collection(db, 'agencies', agency.id, 'members'))
    ]);

    rows.push({
      agencyId: agency.id,
      properties: properties.size,
      tenants: tenants.size,
      documentsMb: documents.docs.reduce((sum, doc) => sum + Number((doc.data() as any).size || 0) / 1024 / 1024, 0),
      users: members.size
    });
  }

  return rows;
}
