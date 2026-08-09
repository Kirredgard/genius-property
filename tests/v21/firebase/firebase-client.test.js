import { describe, it, expect } from 'vitest';
import { getFirebaseEnv } from '../../../js/v21/firebase/firebase-client.js';

describe('firebase client env', () => {
  it('retourne une structure de configuration', () => {
    const env = getFirebaseEnv();
    expect(env).toHaveProperty('apiKey');
    expect(env).toHaveProperty('projectId');
    expect(env).toHaveProperty('authDomain');
  });
});
