import { describe, expect, it } from 'vitest';
import { getFirebaseConfig } from '../js/v21/config/firebase-config.js';

describe('getFirebaseConfig', () => {
  it('refuse une configuration incomplète', () => {
    expect(() => getFirebaseConfig({ projectId: 'demo' })).toThrow(/manquante/);
  });

  it('retourne une configuration complète et figée', () => {
    const config = getFirebaseConfig({
      apiKey: 'demo-key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo',
      appId: 'app-id'
    });

    expect(config.projectId).toBe('demo');
    expect(Object.isFrozen(config)).toBe(true);
  });
});
