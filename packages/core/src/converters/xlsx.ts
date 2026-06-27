import * as XLSX from 'xlsx';
import type { ConversionResult, ConvertOpts } from '../types.js';

function fillMerges(ws: XLSX.WorkSheet): void {
  const merges = ws['!merges'];
  if (!merges?.length) return;
  for (const merge of merges) {
    const topLeft = ws[XLSX.utils.encode_cell(merge.s)];
    if (!topLeft) continue;
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue;
        ws[XLSX.utils.encode_cell({ r, c })] = { v: topLeft.v, w: topLeft.w, t: topLeft.t, z: topLeft.z };
      }
    }
  }
  ws['!merges'] = [];
}

function sheetToGfm(ws: XLSX.WorkSheet): string {
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
  }) as string[][];

  if (rows.length === 0 || rows[0].length === 0) return '';

  const escape = (v: unknown) =>
    String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');

  const header = rows[0].map(escape);
  const sep = header.map(() => '---');

  return [
    '| ' + header.join(' | ') + ' |',
    '| ' + sep.join(' | ') + ' |',
    ...rows.slice(1).map(row => '| ' + row.map(escape).join(' | ') + ' |'),
  ].join('\n');
}

export async function convertXlsx(
  input: Uint8Array,
  _opts?: ConvertOpts,
): Promise<ConversionResult> {
  const start = Date.now();
  const inputBytes = input.byteLength;

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(input, { type: 'array' });
  } catch (err) {
    return {
      markdown: '',
      stats: {
        fidelity: 'failed',
        warnings: [err instanceof Error ? err.message : String(err)],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: 0,
      },
    };
  }

  const sections: string[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    fillMerges(ws);
    const table = sheetToGfm(ws);
    if (!table) {
      sections.push(`<!-- sheet ${name.replace(/[\r\n]/g, '_')}: empty -->`);
    } else {
      sections.push(`## ${name.replace(/[\r\n]/g, '_')}\n\n${table}`);
    }
  }

  const markdown = sections.join('\n\n');
  return {
    markdown,
    stats: {
      fidelity: 'high',
      warnings: [],
      durationMs: Date.now() - start,
      inputBytes,
      outputBytes: markdown.length,
    },
  };
}
