import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';

describe('V21 clean package smoke test', () => {
  it('has the main entry HTML file', () => {
    expect(existsSync('index.html')).toBe(true);
  });

  it('has Firebase configuration template available', () => {
    expect(existsSync('public/env.js') || existsSync('public/env.example.js')).toBe(true);
  });
});
