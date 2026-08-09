import { createKnowledgeBaseArticle, listKnowledgeBaseArticles } from '../support/knowledge-base.repository.js';

export async function initSupportAdminPage(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('#kb-form');
  const output = document.querySelector<HTMLElement>('#kb-output');

  await render();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const result = await createKnowledgeBaseArticle({
      title: String(data.get('title') || '').trim(),
      category: String(data.get('category') || 'Support').trim(),
      content: String(data.get('content') || '').trim()
    });

    form.reset();
    await render(result);
  });

  async function render(lastResult: unknown = null) {
    const articles = await listKnowledgeBaseArticles().catch(() => []);
    if (output) output.textContent = JSON.stringify({ lastResult, articles }, null, 2);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupportAdminPage, { once: true });
  } else {
    initSupportAdminPage();
  }
}
