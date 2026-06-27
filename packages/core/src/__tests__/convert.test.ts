import { describe, it, expect } from 'vitest';
import { convert } from '../index.js';

describe('convert()', () => {
  it('does not throw for unsupported extension', async () => {
    await expect(convert(new Uint8Array([1, 2, 3]), 'mystery.xyz')).resolves.toBeDefined();
  });

  it('returns fidelity:failed with a warning for unknown extension', async () => {
    const result = await convert(new Uint8Array([1, 2, 3]), 'unknown.xyz');
    expect(result.stats.fidelity).toBe('failed');
    expect(result.stats.warnings.length).toBeGreaterThan(0);
    expect(result.stats.warnings[0]).toContain('.xyz');
    expect(result.markdown).toBe('');
  });

  it('includes the extension in the warning message', async () => {
    const result = await convert(new Uint8Array(), 'doc.abc123');
    expect(result.stats.warnings.some(w => w.includes('.abc123'))).toBe(true);
  });

  it('sets inputBytes from the buffer length', async () => {
    const result = await convert(new Uint8Array(42), 'file.xyz');
    expect(result.stats.inputBytes).toBe(42);
  });

  it('sets outputBytes to 0 on failed conversion', async () => {
    const result = await convert(new Uint8Array(10), 'file.xyz');
    expect(result.stats.outputBytes).toBe(0);
  });

  it('records a non-negative durationMs', async () => {
    const result = await convert(new Uint8Array(), 'file.xyz');
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns fidelity:failed for invalid bytes of a known format', async () => {
    const result = await convert(new Uint8Array([0xd0, 0xcf]), 'report.docx');
    expect(result.stats.fidelity).toBe('failed');
    expect(result.stats.warnings.length).toBeGreaterThan(0);
  });
});
