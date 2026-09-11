import express from 'express';
import nodemailer from 'nodemailer';
import { inviteTemplate, welcomeTemplate, betaWelcomeTemplate, billingStatusTemplate } from './email-templates.js';

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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
    await sendMail(req.body.to, inviteTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] invite failed:', error);
    res.status(500).json({ ok: false, error: 'invite_email_failed' });
  }
});

app.post('/api/emails/send-welcome', async (req, res) => {
  try {
    await sendMail(req.body.to, welcomeTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] welcome failed:', error);
    res.status(500).json({ ok: false, error: 'welcome_email_failed' });
  }
});

app.post('/api/emails/send-beta-welcome', async (req, res) => {
      try {
        await sendMail(req.body.to, betaWelcomeTemplate(req.body));
        res.json({ ok: true });
      } catch (error) {
        console.error('[Email API] beta welcome failed:', error);
        res.status(500).json({ ok: false, error: 'beta_welcome_email_failed' });
      }
    });

    app.post('/api/emails/send-billing-status', async (req, res) => {
  try {
    await sendMail(req.body.to, billingStatusTemplate(req.body));
    res.json({ ok: true });
  } catch (error) {
    console.error('[Email API] billing failed:', error);
    res.status(500).json({ ok: false, error: 'billing_email_failed' });
  }
});

app.listen(process.env.PORT || 8788, () => {
  console.log('Email API listening');
});
