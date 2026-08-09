export function buildWarehouseExport(data: any = {}) {
  return {
    exportedAt: new Date().toISOString(),
    tables: Object.keys(data),
    rows: Object.values(data).flat().length
  };
}
