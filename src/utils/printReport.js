const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatCellValue = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  return val;
};

/**
 * Opens a print-friendly window with a simple table (no actions column).
 * @param {{ title: string, columns: { header: string, value: (row: object) => * }[], rows: object[], subtitle?: string }} options
 */
export function printReport({ title, columns, rows, subtitle }) {
  if (!rows?.length) {
    alert('No records to print for the current filters.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print the report.');
    return;
  }

  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const headerCells = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('');
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const raw = typeof c.value === 'function' ? c.value(row) : row[c.key];
          return `<td>${escapeHtml(formatCellValue(raw))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; font-size: 12px; }
    h1 { font-size: 20px; margin-bottom: 6px; }
    .meta { color: #555; font-size: 11px; margin-bottom: 16px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; font-size: 11px; }
    td { font-size: 11px; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 16px; font-size: 10px; color: #666; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Generated: ${escapeHtml(generatedAt)}<br />
    Total records: ${rows.length}
    ${subtitle ? `<br />${escapeHtml(subtitle)}` : ''}
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">Unilink — Filtered Report</div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
