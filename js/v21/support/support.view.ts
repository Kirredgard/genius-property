import { searchHelpArticles } from './help-content.js';

export function renderSupportCenter(rootSelector = '#support-root', query = '') {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const articles = searchHelpArticles(query);

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Centre d’aide</h2>
      <input id="support-search" class="v21-search-input" placeholder="Rechercher..." value="${escapeHtml(query)}" />
    </section>

    <section class="v21-table">
      ${articles.map((article) => `
        <article class="v21-table-row">
          <strong>${escapeHtml(article.title)}</strong>
          <span>${escapeHtml(article.category)}</span>
          <p>${escapeHtml(article.content)}</p>
        </article>
      `).join('')}
    </section>
  `;

  root.querySelector('#support-search')?.addEventListener('input', (event) => {
    renderSupportCenter(rootSelector, (event.target as HTMLInputElement).value);
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
