import { describe, it, expect } from 'vitest';
import { searchEverywhere } from '../../../js/v21/search/global-search.service.js';

describe('global search', () => {
  it('retourne un résultat', () => {
    const rows = searchEverywhere('john', {
      tenants: [{ name: 'John Doe' }]
    });

    expect(rows.length).toBe(1);
  });
});
