import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convert } from '../index.js';

const GOLDEN_DIR = join(import.meta.dirname, '..', '..', 'golden');
const FORMATS = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'docx', 'xlsx', 'pptx', 'pdf'] as const;

describe('determinism tests: identical output on repeated runs', () => {
  for (const ext of FORMATS) {
    test(`determinism: ${ext}`, async () => {
      const buf = readFileSync(join(GOLDEN_DIR, 'inputs', `sample.${ext}`));
      const results = await Promise.all(
        Array.from({ length: 3 }, () => {
          const input = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
          return convert(input, `sample.${ext}`);
        }),
      );
      expect(results[1].markdown).toBe(results[0].markdown);
      expect(results[2].markdown).toBe(results[0].markdown);
    });
  }
});
