const STORAGE_KEY = 'gp:v21:lastState';

export function saveRecoveryState(state: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state,
    updatedAt: new Date().toISOString()
  }));
}

export function restoreRecoveryState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (_) {
    return {};
  }
}
