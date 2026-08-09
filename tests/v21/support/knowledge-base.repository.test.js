import { describe, it, expect } from 'vitest';
import { listKnowledgeBaseArticles } from '../../../js/v21/support/knowledge-base.repository.js';

describe('knowledge base repository', () => {
  it('retourne le fallback articles sans firestore', async () => {
    const rows = await listKnowledgeBaseArticles();
    expect(rows.length).toBeGreaterThan(0);
  });
});
