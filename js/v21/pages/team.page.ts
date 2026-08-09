import { trackPageView, trackProductEvent, trackBillingUpgrade } from '../audit/product-tracking.service.js';
import { sendInviteEmail } from '../emails/email-api.client.js';
import { createInvitation, listInvitations } from '../onboarding/invitations.service.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

export async function initTeamPage(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('#invite-form');
  const output = document.querySelector<HTMLElement>('#team-output');

  await trackProductEvent({ event: 'team_invite_created', category: 'team' });
        await render();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const result = await createInvitation({
      email: String(data.get('email') || '').trim(),
      role: String(data.get('role') || 'viewer').trim()
    });

    let inviteEmailResult = null;
        const context = buildUserAgencyContext();
        if (result.ok && result.inviteUrl) {
          inviteEmailResult = await sendInviteEmail({
            agencyId: context.agencyId,
            to: String(data.get('email') || '').trim(),
            inviteUrl: result.inviteUrl,
            role: String(data.get('role') || 'viewer').trim()
          }).catch((error) => ({ ok: false, error: error.message }));
        }

        if (output) output.textContent = JSON.stringify({ invitation: result, email: inviteEmailResult }, null, 2);
    await render();
  });

  async function render() {
    const context = buildUserAgencyContext();
    const invitations = await listInvitations({ agencyId: context.agencyId }).catch(() => []);

    if (output) {
      output.textContent = JSON.stringify({
        context,
        invitations
      }, null, 2);
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamPage, { once: true });
  } else {
    initTeamPage();
  }
}
