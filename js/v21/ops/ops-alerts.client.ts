export interface OpsAlertInput {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical' | string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export function getOpsApiBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).GPV21_OPS_API_URL) {
    return String((window as any).GPV21_OPS_API_URL);
  }

  return import.meta.env.VITE_OPS_API_URL || '/api/ops';
}

export async function sendOpsAlert(input: OpsAlertInput) {
  const response = await fetch(`${getOpsApiBaseUrl()}/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`[V21][Ops] Alert failed: ${response.status}`);
  }

  return response.json();
}
