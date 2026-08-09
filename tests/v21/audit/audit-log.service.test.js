import { describe, it, expect, beforeEach } from 'vitest';
import { persistLocalAuditLog, readLocalAuditLogs } from '../../../js/v21/audit/audit-log.service.js';

describe('audit log service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste un audit log local', () => {
    persistLocalAuditLog({ action: 'test', createdAt: '2025-01-01' });

    const logs = readLocalAuditLogs();
    expect(logs.length).toBe(1);
  });
});
