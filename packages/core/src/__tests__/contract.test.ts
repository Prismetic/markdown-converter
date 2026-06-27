import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convert } from '../index.js';
import type { FidelityLevel } from '../index.js';

const GOLDEN_DIR = join(import.meta.dirname, '..', '..', 'golden');
const FORMATS = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'docx', 'xlsx', 'pptx', 'pdf'] as const;
const VALID_FIDELITY: FidelityLevel[] = ['high', 'degraded', 'failed'];

describe('contract tests: ConversionResult shape', () => {
  for (const ext of FORMATS) {
    test(`contract: ${ext}`, async () => {
      const buf = readFileSync(join(GOLDEN_DIR, 'inputs', `sample.${ext}`));
      const input = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      const result = await convert(input, `sample.${ext}`);

      expect(typeof result.markdown).toBe('string');
      expect(VALID_FIDELITY).toContain(result.stats.fidelity);
      expect(Array.isArray(result.stats.warnings)).toBe(true);
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.inputBytes).toBeGreaterThan(0);
      expect(result.stats.outputBytes).toBeGreaterThanOrEqual(0);
    });
  }
});
