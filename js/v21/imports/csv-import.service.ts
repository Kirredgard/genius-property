export function parseCsv(content = '') {
  const rows = content.trim().split('\n');
  const headers = rows[0]?.split(',') || [];

  return rows.slice(1).map((row) => {
    const values = row.split(',');

    return headers.reduce((acc, header, index) => {
      acc[header.trim()] = values[index]?.trim() || '';
      return acc;
    }, {} as Record<string, string>);
  });
}
