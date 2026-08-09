import { describe, it, expect, beforeEach } from 'vitest';
import { renderDashboardKpis } from '../../../js/v21/modules/dashboard/ui/dashboard-kpi.view.js';

describe('dashboard KPI view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="dashboard-root"></div>';
  });

  it('affiche les cartes KPI', () => {
    renderDashboardKpis([{ key: 'revenue', label: 'Revenus', value: '100 FCFA' }], '#dashboard-root');
    expect(document.querySelector('#dashboard-root').textContent).toContain('Revenus');
    expect(document.querySelector('#dashboard-root').textContent).toContain('100 FCFA');
  });
});
