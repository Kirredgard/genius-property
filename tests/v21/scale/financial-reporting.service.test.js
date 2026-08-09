import { describe, it, expect } from 'vitest';
import { buildFinancialReport } from '../../../js/v21/finance/financial-reporting.service.js';

describe('financial reporting', () => {
  it('calcule marge', () => {
    const report = buildFinancialReport({
      revenue: 1000,
      costs: 250
    });

    expect(report.margin).toBe(75);
  });
});
