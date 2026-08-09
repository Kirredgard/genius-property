export async function triggerExternalWebhook(url: string, payload: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return {
    ok: response.ok,
    status: response.status
  };
}
