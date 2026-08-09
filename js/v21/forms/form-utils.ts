export interface FieldConfig {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}

export function renderForm(rootSelector: string, title: string, fields: FieldConfig[], submitLabel = 'Enregistrer'): HTMLFormElement | null {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>${escapeHtml(title)}</h2>
      <form class="v21-form">
        ${fields.map(renderField).join('')}
        <div class="v21-form-actions">
          <button data-requires-permission="write" type="submit">${escapeHtml(submitLabel)}</button>
          <p class="v21-form-message" data-form-message></p>
        </div>
      </form>
    </section>
  `;

  return root.querySelector('form');
}

export function readFormData(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const payload: Record<string, unknown> = {};

  for (const [key, value] of data.entries()) {
    payload[key] = value;
  }

  return payload;
}

export function setFormMessage(form: HTMLFormElement, message: string, type: 'success' | 'error' = 'success'): void {
  const target = form.querySelector('[data-form-message]');
  if (!target) return;

  target.textContent = message;
  target.setAttribute('data-type', type);
}

function renderField(field: FieldConfig): string {
  return `
    <label class="v21-form-field">
      <span>${escapeHtml(field.label)}</span>
      <input name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || 'text')}" ${field.required ? 'required' : ''} />
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
