import { describe, it, expect } from 'vitest';
import { buildSmokeTestReport } from '../../../js/v21/qa/smoke-tests.service.js';

describe('smoke tests service', () => {
  it('marque un test passé', () => {
    const report = buildSmokeTestReport({ login: true });
    expect(report.find((item) => item.key === 'login').status).toBe('passed');
  });
});
