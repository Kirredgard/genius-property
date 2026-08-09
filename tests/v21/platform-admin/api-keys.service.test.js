import { describe, it, expect } from 'vitest';
import { createApiKey } from '../../../js/v21/security/api-keys.service.js';

describe('api keys service', () => {
  it('génère une clé API', () => {
    const key = createApiKey('test');
    expect(key.id).toContain('gpv21_');
  });
});
