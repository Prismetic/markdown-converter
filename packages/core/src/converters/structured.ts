import type { ConversionResult } from '../types.js';
import * as XLSX from 'xlsx';

function sheetToGfm(sheet: XLSX.WorkSheet): string {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (rows.length === 0) return '';

  const stringRows = rows.map(row => row.map(cell => String(cell ?? '')));
  const header = stringRows[0];
  const separator = header.map(() => '---');

  const lines = [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...stringRows.slice(1).map(row => '| ' + row.join(' | ') + ' |'),
  ];
  return lines.join('\n');
}

export function convertCsv(input: Uint8Array): ConversionResult {
  const start = Date.now();
  try {
    const wb = XLSX.read(input, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const markdown = sheetToGfm(sheet);
    return {
      markdown,
      stats: {
        fidelity: 'high',
        warnings: [],
        durationMs: Date.now() - start,
        inputBytes: input.byteLength,
        outputBytes: markdown.length,
      },
    };
  } catch (err) {
    return {
      markdown: '',
      stats: {
        fidelity: 'failed',
        warnings: [String(err)],
        durationMs: Date.now() - start,
        inputBytes: input.byteLength,
        outputBytes: 0,
      },
    };
  }
}

export function convertJson(input: Uint8Array): ConversionResult {
  const start = Date.now();
  const raw = new TextDecoder().decode(input);
  try {
    const parsed: unknown = JSON.parse(raw);
    const pretty = JSON.stringify(parsed, null, 2);
    const markdown = '```json\n' + pretty + '\n```';
    return {
      markdown,
      stats: {
        fidelity: 'high',
        warnings: [],
        durationMs: Date.now() - start,
        inputBytes: input.byteLength,
        outputBytes: markdown.length,
      },
    };
  } catch (err) {
    const markdown = '```json\n' + raw + '\n```';
    return {
      markdown,
      stats: {
        fidelity: 'degraded',
        warnings: [`JSON parse failed: ${String(err)}`],
        durationMs: Date.now() - start,
        inputBytes: input.byteLength,
        outputBytes: markdown.length,
      },
    };
  }
}

export function convertXml(input: Uint8Array): ConversionResult {
  const start = Date.now();
  const raw = new TextDecoder().decode(input);
  const markdown = '```xml\n' + raw + '\n```';
  return {
    markdown,
    stats: {
      fidelity: 'high',
      warnings: [],
      durationMs: Date.now() - start,
      inputBytes: input.byteLength,
      outputBytes: markdown.length,
    },
  };
}
