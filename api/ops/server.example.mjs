import express from 'express';

const app = express();
app.use(express.json());

async function postWebhook(url, payload) {
  if (!url) return { skipped: true };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { ok: response.ok, status: response.status };
}

app.post('/api/ops/alert', async (req, res) => {
  const alert = {
    title: req.body.title || 'Genius Property alert',
    message: req.body.message || '',
    severity: req.body.severity || 'info',
    source: req.body.source || 'v21',
    metadata: req.body.metadata || {},
    createdAt: new Date().toISOString()
  };

  const text = `[${alert.severity.toUpperCase()}] ${alert.title}\n${alert.message}`;

  const [slack, discord] = await Promise.all([
    postWebhook(process.env.SLACK_WEBHOOK_URL, { text }),
    postWebhook(process.env.DISCORD_WEBHOOK_URL, { content: text })
  ]);

  res.json({ ok: true, alert, delivery: { slack, discord } });
});

app.listen(process.env.PORT || 8789, () => {
  console.log('Ops API listening');
});
