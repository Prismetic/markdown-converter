import { describe, test, expect } from 'vitest';
import { fileToUint8 } from '../../src/shared/fileToUint8.js';

describe('fileToUint8', () => {
  test('converts a File to Uint8Array with correct bytes', async () => {
    const content = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    const result = await fileToUint8(file);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
  });

  test('returns Uint8Array with correct byteLength', async () => {
    const data = new Uint8Array(256).map((_, i) => i);
    const file = new File([data], 'data.bin');
    const result = await fileToUint8(file);
    expect(result.byteLength).toBe(256);
  });

  test('handles empty file', async () => {
    const file = new File([], 'empty.txt');
    const result = await fileToUint8(file);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBe(0);
  });

  test('preserves binary content exactly', async () => {
    const bytes = new Uint8Array([0x00, 0x7F, 0x80, 0xFF, 0x01, 0xFE]);
    const file = new File([bytes], 'binary.bin');
    const result = await fileToUint8(file);
    expect(Array.from(result)).toEqual([0x00, 0x7F, 0x80, 0xFF, 0x01, 0xFE]);
  });

  test('handles multi-chunk file (multiple ArrayBuffer parts)', async () => {
    const part1 = new Uint8Array([1, 2, 3]);
    const part2 = new Uint8Array([4, 5, 6]);
    const file = new File([part1, part2], 'multi.bin');
    const result = await fileToUint8(file);
    expect(result.byteLength).toBe(6);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('returns a view over the full ArrayBuffer', async () => {
    const data = new Uint8Array([10, 20, 30]);
    const file = new File([data], 'test.bin');
    const result = await fileToUint8(file);
    expect(result.buffer).toBeInstanceOf(ArrayBuffer);
    expect(result.buffer.byteLength).toBeGreaterThanOrEqual(result.byteLength);
  });
});
