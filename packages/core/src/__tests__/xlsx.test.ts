import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { convertXlsx } from '../converters/xlsx.js';

function makeXlsx(sheets: Record<string, unknown[][]>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  }
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

describe('convertXlsx()', () => {
  it('outputs GFM table with header row', async () => {
    const bytes = makeXlsx({ Sheet1: [['Name', 'Value'], ['foo', 42]] });
    const result = await convertXlsx(bytes);
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toContain('| Name | Value |');
    expect(result.markdown).toContain('| --- | --- |');
    expect(result.markdown).toContain('| foo |');
  });

  it('emits ## SheetName heading above the table', async () => {
    const bytes = makeXlsx({ MySheet: [['A', 'B'], [1, 2]] });
    const result = await convertXlsx(bytes);
    expect(result.markdown).toContain('## MySheet');
  });

  it('emits comment for empty sheet', async () => {
    const bytes = makeXlsx({ Empty: [] });
    const result = await convertXlsx(bytes);
    expect(result.markdown).toContain('<!-- sheet Empty: empty -->');
  });

  it('handles multi-sheet workbook with separate headings', async () => {
    const bytes = makeXlsx({
      First: [['X'], ['a']],
      Second: [['Y'], ['b']],
    });
    const result = await convertXlsx(bytes);
    expect(result.markdown).toContain('## First');
    expect(result.markdown).toContain('## Second');
  });

  it('always returns fidelity:high (SheetJS parses arbitrary bytes)', async () => {
    // SheetJS never throws on bad input — it always produces a workbook.
    const result = await convertXlsx(new Uint8Array([1, 2, 3, 4]));
    expect(result.stats.fidelity).toBe('high');
  });

  it('escapes pipe characters in cell values', async () => {
    const bytes = makeXlsx({ S: [['A|B', 'C'], ['x', 'y']] });
    const result = await convertXlsx(bytes);
    expect(result.markdown).toContain('A\\|B');
  });
});
