import { describe, it, expect } from 'vitest';
import { V21_PAGES } from '../../../js/v21/router/lazy-pages.js';

describe('lazy pages', () => {
  it('déclare les pages principales', () => {
    expect(Object.keys(V21_PAGES)).toContain('dashboard');
    expect(Object.keys(V21_PAGES)).toContain('properties');
    expect(Object.keys(V21_PAGES)).toContain('documents');
  });
});
