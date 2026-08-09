import { describe, it, expect } from 'vitest';
import { buildFieldValidationReport } from '../../../js/v21/validation/field-validation.service.js';

describe('field validation service', () => {
  it('marque une étape passée', () => {
    const report = buildFieldValidationReport({ Connexion: true });
    expect(report.find((item) => item.step === 'Connexion').status).toBe('passed');
  });
});
