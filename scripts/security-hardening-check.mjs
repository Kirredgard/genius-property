import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  {
    file: 'storage.rules.v21',
    mustContain: [
      'firestore.get(/databases/(default)/documents/agencies/$(agencyId)/members/$(request.auth.uid)).exists',
      "agencyRole(agencyId) in ['owner', 'admin', 'agent']",
      "agencyRole(agencyId) in ['owner', 'admin']"
    ]
  },
  {
    file: 'api/billing/server.example.mjs',
    mustContain: [
      'requireFirebaseUser(req)',
      "requireAgencyRole(user.uid, agencyId, ['owner', 'admin'])"
    ],
    mustNotContain: ["const { agencyId, plan, successUrl, cancelUrl, email } = req.body || {};"]
  },
  {
    file: 'api/emails/server.example.mjs',
    mustContain: [
      'requireAgencyAdmin(req, req.body?.agencyId)',
      "x-internal-api-key",
      'EMAIL_API_INTERNAL_SECRET'
    ]
  },
  {
    file: 'api/invitations/server.example.mjs',
    mustContain: [
      'requireFirebaseUser(req)',
      "collectionGroup('invitations')",
      'transaction.set(memberRef'
    ]
  },
  {
    file: 'js/v21/onboarding/invitations.service.ts',
    mustContain: [
      'VITE_INVITATION_API_URL',
      "fetch(`${baseUrl}/accept`,",
      'crypto.getRandomValues'
    ]
  }
];

let failed = false;
for (const check of checks) {
  const filePath = path.join(root, check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL missing ${check.file}`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const needle of check.mustContain || []) {
    if (!content.includes(needle)) {
      console.error(`FAIL ${check.file}: missing ${needle}`);
      failed = true;
    }
  }
  for (const needle of check.mustNotContain || []) {
    if (content.includes(needle)) {
      console.error(`FAIL ${check.file}: forbidden pattern ${needle}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('Security hardening checks passed.');
