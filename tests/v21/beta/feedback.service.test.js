import { describe, it, expect, beforeEach } from 'vitest';
import { persistLocalFeedback, readLocalFeedback } from '../../../js/v21/beta/feedback.service.js';

describe('feedback service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste feedback local', () => {
    persistLocalFeedback({ type: 'bug', message: 'test' });
    expect(readLocalFeedback()).toHaveLength(1);
  });
});
