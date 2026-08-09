export interface SendInviteEmailInput {
  to: string;
  agencyId: string;
  inviteUrl: string;
  agencyName?: string;
  role?: string;
}

export interface SendBillingEmailInput {
  to: string;
  agencyName?: string;
  status: string;
  plan?: string;
}

export function getEmailApiBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).GPV21_EMAIL_API_URL) {
    return String((window as any).GPV21_EMAIL_API_URL);
  }

  return import.meta.env.VITE_EMAIL_API_URL || '/api/emails';
}

export async function sendInviteEmail(input: SendInviteEmailInput) {
  return postEmail('/send-invite', input);
}

export async function sendWelcomeEmail(input: { to: string; agencyId: string; agencyName?: string }) {
  return postEmail('/send-welcome', input);
}

export async function sendBetaWelcomeEmail(input: { to: string; agencyId: string; agencyName?: string; guideUrl?: string }) {
      return postEmail('/send-beta-welcome', input);
    }

    export async function sendBillingStatusEmail(input: SendBillingEmailInput) {
  return postEmail('/send-billing-status', input);
}

async function postEmail(path: string, payload: unknown) {
  const { getFirebaseAuthHeaders } = await import('../auth/api-auth.js');
  const response = await fetch(`${getEmailApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: await getFirebaseAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`[V21][Email] Envoi impossible: ${response.status}`);
  }

  return response.json();
}
