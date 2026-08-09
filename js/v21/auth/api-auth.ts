import { getFirebaseClient } from '../firebase/firebase-client.js';

/**
 * Returns a short-lived Firebase ID token for authenticated API calls.
 * The backend remains the authority for identity and authorization.
 */
export async function getFirebaseIdToken(forceRefresh = false): Promise<string> {
  const client = getFirebaseClient();
  const user = client?.auth?.currentUser;

  if (!user) {
    throw new Error('[V21][Auth] Utilisateur non authentifié.');
  }

  return user.getIdToken(forceRefresh);
}

export async function getFirebaseAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getFirebaseIdToken();
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}
