import { describe, it, expect, beforeEach } from 'vitest';
import { captureError, getErrorLogs, clearErrorLogs } from '../../../js/v21/monitoring/error-monitor.js';

describe('error monitor', () => {
  beforeEach(() => {
    clearErrorLogs();
  });

  it('capture une erreur', () => {
    captureError({ message: 'Test error', type: 'manual' });
    expect(getErrorLogs()).toHaveLength(1);
    expect(getErrorLogs()[0].message).toBe('Test error');
  });
});
