/**
 * Helper untuk ekspor data pernikahan ke CSV (kompatibel Excel & Google Sheets)
 * dan JSON cadangan database.
 */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor array of objects atau rows ke CSV dengan UTF-8 BOM agar rapi di Microsoft Excel.
 */
export function exportToCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map((h) => escapeCell(h.label || h.key)).join(",");
  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.format === "function" ? h.format(row[h.key], row) : row[h.key];
        return escapeCell(val);
      })
      .join(",")
  );

  // \uFEFF adalah UTF-8 Byte Order Mark agar Excel membuka karakter dengan benar
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * Ekspor seluruh data cadangan dalam format JSON terstruktur.
 */
export function exportToJson(filename, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
}

/**
 * Cetak laporan ringkasan ke PDF melalui dialog cetak browser.
 */
export function printReport() {
  window.print();
}
