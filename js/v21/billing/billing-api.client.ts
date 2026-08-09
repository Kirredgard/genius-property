import { buildUserAgencyContext } from '../context/user-agency-context.js';
import { getFirebaseAuthHeaders } from '../auth/api-auth.js';

export interface CheckoutInput {
  plan: string;
  agencyId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PortalInput {
  agencyId?: string;
  returnUrl?: string;
}

export function getBillingApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const fromWindow = (window as any).GPV21_BILLING_API_URL;
    if (fromWindow) return String(fromWindow);
  }

  return import.meta.env.VITE_BILLING_API_URL || '/api/billing';
}

export async function createCheckoutSession(input: CheckoutInput): Promise<{ checkoutUrl: string }> {
  const context = buildUserAgencyContext();
  const baseUrl = getBillingApiBaseUrl();

  const response = await fetch(`${baseUrl}/create-checkout-session`, {
    method: 'POST',
    headers: await getFirebaseAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      agencyId: input.agencyId || context.agencyId,
      plan: input.plan,
      successUrl: input.successUrl || `${window.location.origin}/billing-success.v21.html`,
      cancelUrl: input.cancelUrl || `${window.location.origin}/billing-cancel.v21.html`
    })
  });

  if (!response.ok) {
    throw new Error(`[V21][Billing] Checkout impossible: ${response.status}`);
  }

  return response.json();
}

export async function createPortalSession(input: PortalInput = {}): Promise<{ portalUrl: string }> {
  const context = buildUserAgencyContext();
  const baseUrl = getBillingApiBaseUrl();

  const response = await fetch(`${baseUrl}/create-portal-session`, {
    method: 'POST',
    headers: await getFirebaseAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      agencyId: input.agencyId || context.agencyId,
      returnUrl: input.returnUrl || `${window.location.origin}/billing.v21.html`
    })
  });

  if (!response.ok) {
    throw new Error(`[V21][Billing] Portail impossible: ${response.status}`);
  }

  return response.json();
}

export async function redirectToCheckout(plan: string): Promise<void> {
  const { checkoutUrl } = await createCheckoutSession({ plan });
  window.location.href = checkoutUrl;
}

export async function redirectToPortal(): Promise<void> {
  const { portalUrl } = await createPortalSession();
  window.location.href = portalUrl;
}
