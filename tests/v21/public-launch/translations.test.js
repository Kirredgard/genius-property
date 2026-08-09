import { describe, it, expect } from 'vitest';
import { translate } from '../../../js/v21/i18n/translations.js';

describe('translations', () => {
  it('traduit welcome', () => {
    expect(translate('en', 'welcome')).toBe('Welcome');
  });
});
