import { describe, test, expect } from 'vitest';
import type { ExtMsg, ConversionStats } from '../../src/shared/messages.js';

const STATS: ConversionStats = {
  fidelity: 'high',
  warnings: [],
  durationMs: 10,
  inputBytes: 100,
  outputBytes: 80,
};

describe('ExtMsg contract', () => {
  test('CONVERT_PDF carries bytes array and filename', () => {
    const bytes = Array.from(new Uint8Array([0x50, 0x4b, 0x03, 0x04])); // PK zip magic
    const msg: ExtMsg = { type: 'CONVERT_PDF', payload: { bytes, filename: 'sample.docx' } };
    expect(msg.type).toBe('CONVERT_PDF');
    expect((msg as Extract<ExtMsg, { type: 'CONVERT_PDF' }>).payload.bytes).toHaveLength(4);
    expect((msg as Extract<ExtMsg, { type: 'CONVERT_PDF' }>).payload.filename).toBe('sample.docx');
  });

  test('CONVERT_PDF_RESULT carries markdown and stats', () => {
    const msg: ExtMsg = { type: 'CONVERT_PDF_RESULT', markdown: '# Hello\n\nWorld', stats: STATS };
    expect(msg.type).toBe('CONVERT_PDF_RESULT');
    expect((msg as Extract<ExtMsg, { type: 'CONVERT_PDF_RESULT' }>).markdown).toBe('# Hello\n\nWorld');
  });

  test('CONVERT_PDF_ERROR carries error string', () => {
    const msg: ExtMsg = { type: 'CONVERT_PDF_ERROR', error: 'Unsupported format: .exe' };
    expect(msg.type).toBe('CONVERT_PDF_ERROR');
    expect((msg as Extract<ExtMsg, { type: 'CONVERT_PDF_ERROR' }>).error).toBe('Unsupported format: .exe');
  });
});

describe('Uint8Array <-> number[] serialization (chrome.runtime boundary)', () => {
  // chrome.runtime.sendMessage uses structured clone, which loses typed array identity
  // across extension contexts in some Chrome versions. Serialize to number[] to be safe.

  test('round-trips through number[] without data loss', () => {
    const original = new Uint8Array([0, 127, 200, 255, 1, 128]);
    const serialized: number[] = Array.from(original);
    const restored = new Uint8Array(serialized);
    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  test('preserves all 256 byte values', () => {
    const all256 = new Uint8Array(256).map((_, i) => i);
    const roundTripped = new Uint8Array(Array.from(all256));
    expect(Array.from(roundTripped)).toEqual(Array.from(all256));
  });

  test('handles large byte arrays (64 KB)', () => {
    const large = new Uint8Array(65536).map((_, i) => i & 0xff);
    const roundTripped = new Uint8Array(Array.from(large));
    expect(roundTripped).toEqual(large);
  });

  test('handles empty byte array', () => {
    const empty = new Uint8Array(0);
    const serialized = Array.from(empty);
    expect(serialized).toHaveLength(0);
    const restored = new Uint8Array(serialized);
    expect(restored.byteLength).toBe(0);
  });

  test('deserialized result is a proper Uint8Array', () => {
    const bytes = new Uint8Array([42, 43, 44]);
    const restored = new Uint8Array(Array.from(bytes));
    expect(restored).toBeInstanceOf(Uint8Array);
  });
});
