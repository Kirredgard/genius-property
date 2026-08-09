import { describe, it, expect, beforeEach } from 'vitest';
import { renderOwnerReports } from '../../../js/v21/modules/reporting/ui/owner-reporting.view.js';

describe('owner reporting view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="owner-reporting-root"></div>';
  });

  it('affiche les rapports propriétaires', () => {
    renderOwnerReports([{
      ownerId: 'o1',
      owner: { firstName: 'Awa', lastName: 'Diop' },
      propertiesCount: 1,
      totalRevenue: 200000,
      totalExpenses: 50000,
      netBalance: 150000
    }], '#owner-reporting-root');

    expect(document.querySelector('#owner-reporting-root').textContent).toContain('Awa Diop');
    expect(document.querySelector('#owner-reporting-root').textContent).toContain('Net');
  });
});
