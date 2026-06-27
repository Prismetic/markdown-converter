import { describe, it, expect } from 'vitest';
import { convert } from '../index.js';

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('TXT converter', () => {
  it('decodes bytes and returns the trimmed string as markdown', async () => {
    const input = enc('  hello world  ');
    const result = await convert(input, 'note.txt');
    expect(result.markdown).toBe('hello world');
    expect(result.stats.fidelity).toBe('high');
    expect(result.stats.warnings).toHaveLength(0);
  });

  it('sets inputBytes from buffer length', async () => {
    const input = enc('hi');
    const result = await convert(input, 'file.txt');
    expect(result.stats.inputBytes).toBe(input.byteLength);
  });
});

describe('MD converter', () => {
  it('returns content unchanged (no trim, no transform)', async () => {
    const content = '# Title\n\nSome **bold** text.\n';
    const result = await convert(enc(content), 'readme.md');
    expect(result.markdown).toBe(content);
    expect(result.stats.fidelity).toBe('high');
    expect(result.stats.warnings).toHaveLength(0);
  });
});

describe('CSV converter', () => {
  it('converts minimal CSV to a GFM table with a header row', async () => {
    const csv = 'Name,Age\nAlice,30\nBob,25';
    const result = await convert(enc(csv), 'data.csv');
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toMatch(/\| Name \| Age \|/);
    expect(result.markdown).toMatch(/\| --- \| --- \|/);
    expect(result.markdown).toMatch(/\| Alice \| 30 \|/);
  });

  it('escapes pipe characters in cell values to avoid GFM table corruption', async () => {
    const csv = 'A,B\nfoo|bar,baz';
    const result = await convert(enc(csv), 'pipes.csv');
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toContain('foo\\|bar');
    const rows = result.markdown.split('\n');
    for (const row of rows) {
      if (row.startsWith('|')) {
        // Each GFM row must have exactly the right number of columns (3 pipes = 2 cols)
        expect((row.match(/(?<!\\)\|/g) ?? []).length).toBe(3);
      }
    }
  });
});

describe('JSON converter', () => {
  it('pretty-prints valid JSON inside a fenced code block', async () => {
    const obj = { foo: 'bar', n: 42 };
    const result = await convert(enc(JSON.stringify(obj)), 'data.json');
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toMatch(/^```json\n/);
    expect(result.markdown).toMatch(/```$/);
    expect(result.markdown).toContain('"foo": "bar"');
    expect(result.markdown).toContain('"n": 42');
  });

  it('returns raw string in fence + fidelity degraded for invalid JSON', async () => {
    const bad = '{ not valid json !!!';
    const result = await convert(enc(bad), 'broken.json');
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.markdown).toMatch(/^```json\n/);
    expect(result.markdown).toContain(bad);
    expect(result.stats.warnings.length).toBeGreaterThan(0);
  });
});

describe('XML converter', () => {
  it('wraps raw XML in a fenced code block without parsing', async () => {
    const xml = '<root><item id="1">Hello</item></root>';
    const result = await convert(enc(xml), 'feed.xml');
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toMatch(/^```xml\n/);
    expect(result.markdown).toContain(xml);
    expect(result.stats.warnings).toHaveLength(0);
  });
});
