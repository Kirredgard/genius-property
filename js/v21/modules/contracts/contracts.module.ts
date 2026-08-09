import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../permissions/service-permission-guard.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';
import { listContracts, createContract, updateContract, terminateContract } from './services/contracts.service.js';
import { validateContract } from './validators/contract.validator.js';
import { renderContractsList, renderContractsEmptyState } from './ui/contracts.list.js';

const state = {
  contracts: [],
  initialized: false
};

export async function initContractsModule(options = {}) {
  state.initialized = true;

  try {
    state.contracts = await listContracts(options);

    if (!state.contracts.length) {
      renderContractsEmptyState(options.rootSelector);
    } else {
      renderContractsList(state.contracts, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Contracts] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.contracts.length
  };
}

export async function saveContract(payload, options = {
      const permission = requireWritePermission();
      if (!permission.ok) return permission;
}) {
  const validation = validateContract(payload);

  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const result = payload.id
    ? await updateContract(payload.id, validation.value, options)
    : await createContract(validation.value, options);

  return { ok: true, contract: result };
}

export async function closeContract(contractId, options = {
      const permission = requireAdminPermission();
      if (!permission.ok) return permission;
}) {
  if (!contractId) {
    return { ok: false, errors: ['contractId requis'] };
  }

  const result = await terminateContract(contractId, options);
  return { ok: true, contract: result };
}

export function getContractsState() {
  return { ...state, contracts: [...state.contracts] };
}


registerLegacyGlobal('GPV21Contracts', { init: initContractsModule, save: saveContract, terminate: closeContract, state: getContractsState });
