import { describe, it, expect, beforeEach } from 'vitest';
import { buildHealthReport, renderHealthReport } from '../../../js/v21/monitoring/health-report.js';

describe('health report', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="health-report-root"></div>';
  });

  it('construit un rapport santé', () => {
    const report = buildHealthReport();
    expect(report).toHaveProperty('checkedAt');
    expect(report).toHaveProperty('v21');
  });

  it('rend le rapport santé', () => {
    renderHealthReport('#health-report-root');
    expect(document.querySelector('#health-report-root').textContent).toContain('Health Report V21');
  });
});
