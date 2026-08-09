import { createAnnouncement, listAnnouncements } from '../announcements/announcements.service.js';
import { downloadBackupFile } from '../backup/backup-export.service.js';
import { createApiKey, listApiKeys } from '../security/api-keys.service.js';
import { buildDefaultQuotas } from '../quotas/usage-quotas.service.js';

export function initSuperAdminPage(): void {
  const announcementForm = document.querySelector<HTMLFormElement>('#announcement-form');
  const output = document.querySelector<HTMLElement>('#super-admin-output');

  render();

  announcementForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(announcementForm);

    createAnnouncement({
      id: `ann_${Date.now()}`,
      title: String(data.get('title') || ''),
      message: String(data.get('message') || ''),
      severity: String(data.get('severity') || 'info')
    });

    announcementForm.reset();
    render();
  });

  document.querySelector('#create-api-key')?.addEventListener('click', () => {
    createApiKey('super-admin');
    render();
  });

  document.querySelector('#download-backup')?.addEventListener('click', () => {
    downloadBackupFile();
  });

  function render() {
    if (!output) return;

    output.textContent = JSON.stringify({
      announcements: listAnnouncements(),
      apiKeys: listApiKeys(),
      quotas: buildDefaultQuotas()
    }, null, 2);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuperAdminPage, { once: true });
  } else {
    initSuperAdminPage();
  }
}
