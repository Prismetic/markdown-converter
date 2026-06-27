import { describe, it, expect } from 'vitest';
import { convertPdf } from '../converters/pdf.js';

function buildMinimalPdf(pageText: string): Uint8Array {
  const enc = new TextEncoder();
  const stream = `BT /F1 12 Tf 50 750 Td (${pageText}) Tj ET`;

  const obj1 = '1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n';
  const obj2 = '2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n';
  const obj3 =
    '3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]' +
    ' /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>>\nendobj\n';
  const obj4 = `4 0 obj\n<</Length ${stream.length}>>\nstream\n${stream}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n';

  const header = '%PDF-1.4\n';
  const off1 = header.length;
  const off2 = off1 + obj1.length;
  const off3 = off2 + obj2.length;
  const off4 = off3 + obj3.length;
  const off5 = off4 + obj4.length;
  const xrefPos = off5 + obj5.length;

  const pad = (n: number) => n.toString().padStart(10, '0');
  const xref = [
    'xref',
    '0 6',
    '0000000000 65535 f ',
    `${pad(off1)} 00000 n `,
    `${pad(off2)} 00000 n `,
    `${pad(off3)} 00000 n `,
    `${pad(off4)} 00000 n `,
    `${pad(off5)} 00000 n `,
    'trailer',
    '<</Size 6 /Root 1 0 R>>',
    `startxref\n${xrefPos}`,
    '%%EOF',
  ].join('\n');

  return enc.encode(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref);
}

describe('convertPdf()', () => {
  it('extracts text from a minimal valid PDF', async () => {
    const input = buildMinimalPdf('Hello PDF');
    const result = await convertPdf(input);
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.markdown).toContain('Hello');
    expect(result.markdown.length).toBeGreaterThan(0);
  }, 15_000);

  it('sets fidelity to degraded (not high)', async () => {
    const input = buildMinimalPdf('Test');
    const result = await convertPdf(input);
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.stats.fidelity).not.toBe('high');
  }, 15_000);

  it('returns fidelity:failed on corrupt input', async () => {
    const result = await convertPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]));
    expect(result.stats.fidelity).toBe('failed');
    expect(result.markdown).toBe('');
  }, 15_000);

  it('sets outputBytes to markdown length on success', async () => {
    const input = buildMinimalPdf('OutputBytes');
    const result = await convertPdf(input);
    expect(result.stats.outputBytes).toBe(result.markdown.length);
  }, 15_000);

  it('records non-negative durationMs', async () => {
    const input = buildMinimalPdf('Timing');
    const result = await convertPdf(input);
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
  }, 15_000);
});
