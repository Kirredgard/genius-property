export function bindArchiveActions(rootSelector: string, actionSelector: string, handler: (id: string) => Promise<unknown> | unknown): () => void {
  const root = document.querySelector(rootSelector);
  if (!root) return () => {};

  const listener = async (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest(actionSelector) as HTMLElement | null;
    if (!button) return;

    const id = button.dataset.id || '';
    if (!id) return;

    button.setAttribute('disabled', 'true');

    try {
      await handler(id);
      const row = button.closest('[data-row-id], [data-owner-id], [data-property-id], [data-tenant-id], [data-contract-id]');
      row?.remove();
    } catch (error) {
      console.error('[V21][ListActions] archive failed:', error);
    } finally {
      button.removeAttribute('disabled');
    }
  };

  root.addEventListener('click', listener);
  return () => root.removeEventListener('click', listener);
}

export function createActionButton(id: string, label = 'Archiver'): string {
  return `<button data-requires-permission="write" type="button" data-requires-permission="write" class="v21-action-button" data-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
