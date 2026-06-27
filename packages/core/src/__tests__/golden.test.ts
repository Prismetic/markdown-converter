import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convert } from '../index.js';

const GOLDEN_DIR = join(import.meta.dirname, '..', '..', 'golden');
const FORMATS = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'docx', 'xlsx', 'pptx', 'pdf'] as const;

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').trimEnd();
}

describe('golden file tests', () => {
  for (const ext of FORMATS) {
    test(`golden: ${ext}`, async () => {
      const inputBuf = readFileSync(join(GOLDEN_DIR, 'inputs', `sample.${ext}`));
      const input = new Uint8Array(inputBuf.buffer, inputBuf.byteOffset, inputBuf.byteLength);
      const result = await convert(input, `sample.${ext}`);
      expect(result.stats.fidelity).not.toBe('failed');
      const actual = normalize(result.markdown);
      const expected = normalize(
        readFileSync(join(GOLDEN_DIR, 'snapshots', `sample.${ext}.md`), 'utf8'),
      );
      expect(actual).toBe(expected);
    });
  }
});
