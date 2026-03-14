import readXlsxFile, { readSheetNames } from 'read-excel-file/browser';
import type { ParsedData, DataRow } from './types';

export async function parseExcelFile(file: File): Promise<ParsedData> {
  // Read sheet names first
  let sheetName = 'Sheet1';
  try {
    const names = await readSheetNames(file);
    if (names.length > 0) sheetName = names[0];
  } catch {
    // fall through with default name
  }

  // Read the first sheet as a 2D array (no schema)
  const rawRows = await readXlsxFile(file, { sheet: sheetName });

  if (rawRows.length < 2) {
    throw new Error('The spreadsheet appears to be empty or has only a header row.');
  }

  // First row is the header
  const headers = rawRows[0].map((cell, i) =>
    cell !== null ? String(cell) : `Column_${i + 1}`
  );

  // Remaining rows are data
  const dataRows = rawRows.slice(1);

  const rows: DataRow[] = dataRows.map((row) => {
    const normalized: DataRow = {};
    for (let i = 0; i < headers.length; i++) {
      const val = row[i] ?? null;
      if (val === null || val === '') {
        normalized[headers[i]] = null;
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        normalized[headers[i]] = typeof val === 'boolean' ? (val ? 1 : 0) : val;
      } else if (val instanceof Date) {
        normalized[headers[i]] = val.getFullYear();
      } else {
        const str = String(val);
        const num = Number(str.replace(/[,$%\s]/g, ''));
        normalized[headers[i]] = isNaN(num) || str.trim() === '' ? str : num;
      }
    }
    return normalized;
  });

  const numericColumns = headers.filter((h) =>
    rows.some((r) => typeof r[h] === 'number')
  );

  const categoricalColumns = headers.filter(
    (h) => !numericColumns.includes(h)
  );

  return {
    headers,
    rows,
    numericColumns,
    categoricalColumns,
    sheetName,
  };
}

export function getColumnStats(
  rows: DataRow[],
  column: string
): {
  min: number;
  max: number;
  sum: number;
  avg: number;
  count: number;
} {
  const values = rows
    .map((r) => r[column])
    .filter((v): v is number => typeof v === 'number');

  if (values.length === 0) {
    return { min: 0, max: 0, sum: 0, avg: 0, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    sum,
    avg: sum / values.length,
    count: values.length,
  };
}

export function getTopCategoriesByValue(
  rows: DataRow[],
  categoryCol: string,
  valueCol: string,
  limit = 15
): { labels: string[]; values: number[] } {
  const aggregated = new Map<string, number>();

  for (const row of rows) {
    const cat = String(row[categoryCol] ?? 'Unknown');
    const val = typeof row[valueCol] === 'number' ? (row[valueCol] as number) : 0;
    aggregated.set(cat, (aggregated.get(cat) ?? 0) + val);
  }

  const sorted = [...aggregated.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return {
    labels: sorted.map(([k]) => k),
    values: sorted.map(([, v]) => v),
  };
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1) + 'B';
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + 'M';
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(1) + 'K';
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatColumnName(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
