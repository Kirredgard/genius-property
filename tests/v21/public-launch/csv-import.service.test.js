import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../../js/v21/imports/csv-import.service.js';

describe('csv import', () => {
  it('parse un csv simple', () => {
    const rows = parseCsv('name,email\nJohn,john@example.com');
    expect(rows[0].name).toBe('John');
  });
});
