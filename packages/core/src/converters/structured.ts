import type { ConversionResult } from '../types.js';

// ── CSV: pure-JS parser (no Buffer dependency) ───────────────────────────────
// SheetJS (xlsx) calls Buffer.from() at runtime, which breaks browser purity.
// This parser uses only TextDecoder and standard string ops.

function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.length > 0 && row.some(f => f !== '')) rows.push(row);
  return rows;
}

function rowsToGfm(rows: string[][]): string {
  if (rows.length === 0) return '';
  const escape = (v: string) => v.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
  const header = rows[0].map(escape);
  const sep = header.map(() => '---');
  return [
    '| ' + header.join(' | ') + ' |',
    '| ' + sep.join(' | ') + ' |',
    ...rows.slice(1).map(row => '| ' + row.map(escape).join(' | ') + ' |'),
  ].join('\n');
}

export function convertCsv(input: Uint8Array): ConversionResult {
  const start = Date.now();
  try {
    const text = new TextDecoder().decode(input);
    const rows = parseCSVText(text);
    const markdown = rowsToGfm(rows);
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
