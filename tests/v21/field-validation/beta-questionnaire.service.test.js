import { describe, it, expect } from 'vitest';
import { buildQuestionnaireTemplate } from '../../../js/v21/validation/beta-questionnaire.service.js';

describe('beta questionnaire service', () => {
  it('retourne des questions', () => {
    expect(buildQuestionnaireTemplate().length).toBeGreaterThan(0);
  });
});
