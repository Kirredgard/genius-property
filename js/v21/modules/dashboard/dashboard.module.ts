import { getDemoCollection, isDemoModeEnabled, GPV21_DEMO_DATA } from '../../demo/demo-data.js';
import { buildDashboardKpis, buildDashboardKpiCards } from './services/dashboard-kpi.service.js';
import { renderDashboardKpis } from './ui/dashboard-kpi.view.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';

const state = {
  kpis: {},
  cards: [],
  initialized: false
};

export async function initDashboardModule(options = {}) {
  state.initialized = true;

  const demoInput = isDemoModeEnabled() ? GPV21_DEMO_DATA : {};

      const input = {
    properties: options.properties || demoInput.properties || window?.GPV21Properties?.state?.().properties || [],
    tenants: options.tenants || demoInput.tenants || window?.GPV21Tenants?.state?.().tenants || [],
    contracts: options.contracts || demoInput.contracts || window?.GPV21Contracts?.state?.().contracts || [],
    payments: options.payments || demoInput.payments || window?.GPV21Payments?.state?.().payments || [],
    expenses: options.expenses || demoInput.expenses || window?.GPV21Expenses?.state?.().expenses || [],
    owners: options.owners || demoInput.owners || window?.GPV21Owners?.state?.().owners || [],
    payouts: options.payouts || demoInput.payouts || window?.GPV21OwnerPayouts?.state?.().payouts || []
  };

  state.kpis = buildDashboardKpis(input);
  state.cards = buildDashboardKpiCards(state.kpis);

  renderDashboardKpis(state.cards, options.rootSelector);

  return {
    ready: state.initialized,
    count: state.cards.length
  };
}

export function getDashboardState() {
  return {
    ...state,
    cards: [...state.cards],
    kpis: { ...state.kpis }
  };
}

export const GPV21Dashboard = {
  init: initDashboardModule,
  state: getDashboardState,
  buildKpis: buildDashboardKpis,
  buildCards: buildDashboardKpiCards
};

registerLegacyGlobal('GPV21Dashboard', GPV21Dashboard);
