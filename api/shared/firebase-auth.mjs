import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const auth = admin.auth();
export const db = admin.firestore();

export async function requireFirebaseUser(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) {
    const error = new Error('Authentification requise');
    error.statusCode = 401;
    throw error;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    const error = new Error('Token manquant');
    error.statusCode = 401;
    throw error;
  }

  try {
    return await auth.verifyIdToken(token);
  } catch (_) {
    const error = new Error('Token Firebase invalide ou expiré');
    error.statusCode = 401;
    throw error;
  }
}

export async function requireAgencyRole(uid, agencyId, allowedRoles = ['owner', 'admin']) {
  if (!uid || !agencyId) {
    const error = new Error('Agence ou utilisateur manquant');
    error.statusCode = 400;
    throw error;
  }

  const memberSnap = await db.doc(`agencies/${agencyId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    const error = new Error('Accès agence refusé');
    error.statusCode = 403;
    throw error;
  }

  const role = memberSnap.data()?.role;
  if (!allowedRoles.includes(role)) {
    const error = new Error('Permissions insuffisantes');
    error.statusCode = 403;
    throw error;
  }

  return { role, member: memberSnap.data() };
}

export function sendApiError(res, error, fallback = 'internal_error') {
  const status = Number(error?.statusCode) || 500;
  const safeMessage = status >= 500 ? fallback : String(error?.message || fallback);
  return res.status(status).json({ error: safeMessage });
}
