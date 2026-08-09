import { buildFieldValidationReport } from '../validation/field-validation.service.js';
import { buildQuestionnaireTemplate } from '../validation/beta-questionnaire.service.js';
import { addFixItem, listFixItems } from '../validation/fix-tracker.service.js';

export function initFieldValidationPage(): void {
  const root = document.querySelector('#field-validation-root');
  if (!root) return;

  render();

  root.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    if (!form.matches('#fix-form')) return;

    const data = new FormData(form);
    addFixItem({
      title: String(data.get('title') || ''),
      priority: String(data.get('priority') || 'medium')
    });

    form.reset();
    render();
  });

  function render() {
    const report = buildFieldValidationReport({ Connexion: true });
    const questionnaire = buildQuestionnaireTemplate();

    root.innerHTML = `
      <section class="v21-form-card">
        <h2>Validation terrain beta</h2>
        <h3>Checklist</h3>
        <pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>

        <h3>Questionnaire</h3>
        <pre>${escapeHtml(JSON.stringify(questionnaire, null, 2))}</pre>
      </section>

      <section class="v21-form-card">
        <h2>Correctifs à suivre</h2>
        <form id="fix-form" class="v21-form">
          <label class="v21-form-field">
            <span>Titre</span>
            <input name="title" required />
          </label>
          <label class="v21-form-field">
            <span>Priorité</span>
            <select name="priority">
              <option>low</option>
              <option>medium</option>
              <option>high</option>
              <option>critical</option>
            </select>
          </label>
          <div class="v21-form-actions">
            <button type="submit">Ajouter correctif</button>
          </div>
        </form>
        <pre>${escapeHtml(JSON.stringify(listFixItems(), null, 2))}</pre>
      </section>
    `;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFieldValidationPage, { once: true });
  } else {
    initFieldValidationPage();
  }
}
