import { getPersistedSession } from '../auth/auth.service.js';
import { acceptInvitation } from '../onboarding/invitations.service.js';
import { persistUserAgencyContext } from '../context/user-agency-context.js';

export async function initInvitePage(): Promise<void> {
  const root = document.querySelector('#invite-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const session = getPersistedSession();

  root.innerHTML = `
    <section class="v21-form-card">
      <h1>Invitation Genius Property</h1>
      <p>Token: ${escapeHtml(token || 'manquant')}</p>
      <p>L’agence sera résolue automatiquement à partir de l’invitation.</p>
      <button id="accept-invite" type="button">Accepter l’invitation</button>
      <pre id="invite-output"></pre>
    </section>
  `;

  document.querySelector('#accept-invite')?.addEventListener('click', async () => {
    const output = document.querySelector('#invite-output');
    if (!session?.uid) {
      if (output) output.textContent = 'Connecte-toi d’abord via login.v21.html';
      return;
    }

    const result = await acceptInvitation(token, { uid: session.uid, email: session.email || '' });
    if (result.ok) {
      persistUserAgencyContext({ agencyId: result.agencyId, role: result.role, user: session });
    }

    if (output) output.textContent = JSON.stringify(result, null, 2);
  });
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInvitePage, { once: true });
  } else {
    initInvitePage();
  }
}
