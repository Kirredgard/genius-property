import { writeAuditLog } from './audit-log.service.js';

export interface ProductEventInput {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export async function trackProductEvent(input: ProductEventInput) {
  return writeAuditLog({
    action: `product:${input.event}`,
    entityType: input.category || 'product-event',
    entityId: input.label || '',
    metadata: {
      value: input.value || 0,
      ...input.metadata
    }
  });
}

export async function trackPageView(page: string) {
  return trackProductEvent({
    event: 'page_view',
    category: 'navigation',
    label: page
  });
}

export async function trackBillingUpgrade(plan: string) {
  return trackProductEvent({
    event: 'billing_upgrade',
    category: 'billing',
    label: plan
  });
}
