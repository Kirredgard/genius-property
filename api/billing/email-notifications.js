export async function notifyBillingStatus({ emailApiUrl, to, agencyName, status, plan }) {
  if (!emailApiUrl || !to) {
    return { ok: false, skipped: true, reason: 'missing emailApiUrl or recipient' };
  }

  const response = await fetch(`${emailApiUrl}/send-billing-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EMAIL_API_INTERNAL_SECRET
        ? { 'X-Internal-API-Key': process.env.EMAIL_API_INTERNAL_SECRET }
        : {})
    },
    body: JSON.stringify({ to, agencyName, status, plan })
  });

  if (!response.ok) {
    return { ok: false, statusCode: response.status };
  }

  return response.json();
}

export function resolveBillingRecipient(subscriptionDocData = {}, fallbackCustomerEmail = '') {
  return subscriptionDocData.billingEmail
    || subscriptionDocData.email
    || subscriptionDocData.ownerEmail
    || fallbackCustomerEmail
    || '';
}
