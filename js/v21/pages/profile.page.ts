import { getPersistedSession } from '../auth/auth.service.js';
import { hydrateContextFromUserProfile } from '../profile/user-profile.service.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';
import { canAdmin, canWrite, canManageBilling } from '../profile/permissions.js';

export async function initProfilePage(): Promise<void> {
  const root = document.querySelector('#profile-root');
  if (!root) return;

  const session = getPersistedSession();
  const context = await hydrateContextFromUserProfile(session);
  const current = buildUserAgencyContext(context);

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Profil V21</h2>
      <pre>${escapeHtml(JSON.stringify({
        context: current,
        permissions: {
          canWrite: canWrite(current.role),
          canAdmin: canAdmin(current.role),
          canManageBilling: canManageBilling(current.role)
        }
      }, null, 2))}</pre>
    </section>
  `;
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
    document.addEventListener('DOMContentLoaded', initProfilePage, { once: true });
  } else {
    initProfilePage();
  }
}
