/** Descarga filas como CSV (con BOM para que Excel respete las tildes). */
export const downloadCsv = (filename: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
