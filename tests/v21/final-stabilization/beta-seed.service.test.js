import { describe, it, expect } from 'vitest';
import { buildBetaSeedData } from '../../../js/v21/seed/beta-seed.service.js';

describe('beta seed service', () => {
  it('retourne une agence seed', () => {
    expect(buildBetaSeedData().agency.id).toBeTruthy();
  });
});
