/**
 * Lightweight CSV export — no external deps. Opens a download in the browser.
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[], headers?: string[]) {
  if (rows.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('exportToCSV: no rows');
    return;
  }
  const keys = headers ?? Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    keys.join(','),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printArea() {
  window.print();
}
