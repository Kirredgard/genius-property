export function exportLocalStorageSnapshot() {
  const snapshot: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    snapshot[key] = localStorage.getItem(key);
  }

  return {
    exportedAt: new Date().toISOString(),
    snapshot
  };
}

export function downloadBackupFile() {
  const blob = new Blob(
    [JSON.stringify(exportLocalStorageSnapshot(), null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `genius-property-v21-backup-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
