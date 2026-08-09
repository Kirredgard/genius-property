export interface DetailField {
  name: string;
  label: string;
  type?: string;
}

export function getEntityIdFromURL(param = 'id'): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(param) || '';
}

export function renderEntityDetailForm(
  rootSelector: string,
  title: string,
  fields: DetailField[],
  entity: Record<string, unknown> = {}
): HTMLFormElement | null {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>${escapeHtml(title)}</h2>
      <form class="v21-form" data-detail-form>
        ${fields.map((field) => renderField(field, entity[field.name])).join('')}
        <div class="v21-form-actions">
          <button data-requires-permission="write" type="submit">Mettre à jour</button>
          <a data-requires-permission="write" class="v21-action-button" href="javascript:history.back()">Retour</a>
          <p class="v21-form-message" data-form-message></p>
        </div>
      </form>
    </section>
  `;

  return root.querySelector('form');
}

export function readDetailForm(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const payload: Record<string, unknown> = {};

  for (const [key, value] of data.entries()) {
    payload[key] = value;
  }

  return payload;
}

export function setDetailMessage(form: HTMLFormElement, message: string, type: 'success' | 'error' = 'success'): void {
  const target = form.querySelector('[data-form-message]');
  if (!target) return;

  target.textContent = message;
  target.setAttribute('data-type', type);
}

function renderField(field: DetailField, value: unknown): string {
  return `
    <label class="v21-form-field">
      <span>${escapeHtml(field.label)}</span>
      <input name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(String(value ?? ''))}" />
    </label>
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
