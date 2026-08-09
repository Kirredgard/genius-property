export function searchEverywhere(query = '', datasets: Record<string, any[]> = {}) {
  const q = query.trim().toLowerCase();

  return Object.entries(datasets).flatMap(([type, rows]) => {
    return rows
      .filter((row) =>
        JSON.stringify(row).toLowerCase().includes(q)
      )
      .map((row) => ({
        type,
        row
      }));
  });
}
