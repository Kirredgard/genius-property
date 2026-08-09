import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../permissions/service-permission-guard.js';
import { exportOwnerPayoutsToCSV, downloadOwnerPayoutsCSV, buildOwnerPayoutsPrintableHTML, openOwnerPayoutsPrintableView } from './exports/owner-payouts-exporter.js';
import { calculateOwnerPayout, createOwnerPayout, listOwnerPayouts, markOwnerPayoutPaid } from './services/owner-payouts.service.js';
import { validateOwnerPayout } from './validators/owner-payout.validator.js';
import { renderOwnerPayoutsList } from './ui/owner-payouts.list.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';

const state = {
  payouts: [],
  initialized: false
};

export async function initOwnerPayoutsModule(options = {}) {
  state.initialized = true;

  try {
    state.payouts = await listOwnerPayouts(options);
    renderOwnerPayoutsList(state.payouts, options.rootSelector);
  } catch (error) {
    console.error('[V21][OwnerPayouts] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.payouts.length
  };
}

export async function saveOwnerPayout(payload, options = {
      const permission = requireBillingPermission();
      if (!permission.ok) return permission;
}) {
  const validation = validateOwnerPayout(payload);

  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const payout = await createOwnerPayout(validation.value, options);
  return { ok: true, payout };
}

export function getOwnerPayoutsState() {
  return { ...state, payouts: [...state.payouts] };
}

export const GPV21OwnerPayouts = {
  init: initOwnerPayoutsModule,
  state: getOwnerPayoutsState,
  calculate: calculateOwnerPayout,
  save: saveOwnerPayout,
  list: listOwnerPayouts,
  markPaid: markOwnerPayoutPaid,
      exportCSV: exportOwnerPayoutsToCSV,
      downloadCSV: downloadOwnerPayoutsCSV,
      buildPrintableHTML: buildOwnerPayoutsPrintableHTML,
      openPrintableView: openOwnerPayoutsPrintableView
};

registerLegacyGlobal('GPV21OwnerPayouts', GPV21OwnerPayouts);
