import { describe, it, expect } from 'vitest';
import { HELP_ARTICLES, searchHelpArticles } from '../../../js/v21/support/help-content.js';

describe('help content', () => {
  it('contient des articles', () => {
    expect(HELP_ARTICLES.length).toBeGreaterThan(0);
  });

  it('recherche un article', () => {
    expect(searchHelpArticles('billing').length).toBeGreaterThan(0);
  });
});
