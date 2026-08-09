import { describe, it, expect } from 'vitest';
import { buildBetaWeeklyReport } from '../../../js/v21/reports/beta-weekly-report.js';

describe('beta weekly report', () => {
  it('calcule un rapport beta', () => {
    const report = buildBetaWeeklyReport({ feedback: [{}], incidents: [{ status: 'open' }], betaAgencies: [{ status: 'active' }] });
    expect(report.feedbackCount).toBe(1);
    expect(report.openIncidents).toBe(1);
  });
});
