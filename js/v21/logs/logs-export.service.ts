export function exportLogs(logs: any[] = []) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    logs
  }, null, 2);
}
