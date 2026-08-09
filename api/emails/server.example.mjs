import express from 'express';
import nodemailer from 'nodemailer';
import { inviteTemplate, welcomeTemplate, betaWelcomeTemplate, billingStatusTemplate } from './email-templates.js';
import { requireFirebaseUser, requireAgencyRole, sendApiError } from '../shared/firebase-auth.mjs';

const app = express();
app.use(express.json({ limit: '32kb' }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function requireInternalSecret(req) {
  const expected = String(process.env.EMAIL_API_INTERNAL_SECRET || '');
  const received = String(req.headers['x-internal-api-key'] || '');
  return Boolean(expected && received && received === expected);
}

async function requireAgencyAdmin(req, agencyId) {
  const user = await requireFirebaseUser(req);
  await requireAgencyRole(user.uid, agencyId, ['owner', 'admin']);
  return user;
}

async function sendMail(to, template) {
  if (!to) throw new Error('to requis');

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Genius Property <noreply@example.com>',
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
}

app.post('/api/emails/send-invite', async (req, res) => {
  try {
    await requireAgencyAdmin(req, req.body?.agencyId);
    await sendMail(req.body.to, inviteTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] invite failed:', error);
    sendApiError(res, error, 'invite_email_failed');
  }
});

app.post('/api/emails/send-welcome', async (req, res) => {
  try {
    await requireAgencyAdmin(req, req.body?.agencyId);
    await sendMail(req.body.to, welcomeTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] welcome failed:', error);
    sendApiError(res, error, 'welcome_email_failed');
  }
});

app.post('/api/emails/send-beta-welcome', async (req, res) => {
  try {
    await requireAgencyAdmin(req, req.body?.agencyId);
    await sendMail(req.body.to, betaWelcomeTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] beta welcome failed:', error);
    sendApiError(res, error, 'beta_welcome_email_failed');
  }
});

app.post('/api/emails/send-billing-status', async (req, res) => {
  try {
    if (!requireInternalSecret(req)) {
      return res.status(401).json({ ok: false, error: 'internal_auth_required' });
    }
    await sendMail(req.body.to, billingStatusTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] billing failed:', error);
    sendApiError(res, error, 'billing_email_failed');
  }
});

app.listen(process.env.PORT || 8788, () => {
  console.log('Email API listening');
});
