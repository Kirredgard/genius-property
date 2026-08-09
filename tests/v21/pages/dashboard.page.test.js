import { describe, it, expect, beforeEach } from 'vitest';
import { initDashboardPage } from '../../../js/v21/pages/dashboard.page.js';

describe('dashboard page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="dashboard-root"></div><div id="notifications-root"></div>';
  });

  it('initialise la page dashboard', async () => {
    await initDashboardPage();
    expect(document.querySelector('#dashboard-root').textContent).toContain('Dashboard KPI');
  });
});
