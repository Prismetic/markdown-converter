import { describe, it, expect } from 'vitest';
import { convertHtml } from '../converters/html.js';

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('convertHtml()', () => {
  it('converts heading tags to ATX markdown', async () => {
    const result = await convertHtml(enc('<h1>Hello</h1><p>World</p>'));
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toContain('Hello');
    expect(result.markdown).toContain('World');
    expect(result.markdown).not.toContain('<h1>');
  });

  it('strips <script> and <style> blocks from output', async () => {
    const result = await convertHtml(enc('<style>body{color:red}</style><p>Text</p><script>alert(1)</script>'));
    expect(result.markdown).not.toContain('color:red');
    expect(result.markdown).not.toContain('alert');
    expect(result.markdown).toContain('Text');
  });

  it('converts bold and italic to markdown syntax', async () => {
    const result = await convertHtml(enc('<p><strong>bold</strong> and <em>italic</em></p>'));
    expect(result.markdown).toContain('**bold**');
    expect(result.markdown).toContain('italic');
  });

  it('converts table with thead to GFM format', async () => {
    const html =
      '<table><thead><tr><th>Name</th><th>Score</th></tr></thead>' +
      '<tbody><tr><td>Alice</td><td>95</td></tr></tbody></table>';
    const result = await convertHtml(enc(html));
    expect(result.markdown).toContain('| Name |');
    expect(result.markdown).toContain('| --- |');
    expect(result.markdown).toContain('| Alice |');
  });

  it('sets outputBytes to markdown length', async () => {
    const result = await convertHtml(enc('<p>Test</p>'));
    expect(result.stats.outputBytes).toBe(result.markdown.length);
  });

  it('sets fidelity to high and no warnings', async () => {
    const result = await convertHtml(enc('<p>x</p>'));
    expect(result.stats.fidelity).toBe('high');
    expect(result.stats.warnings).toHaveLength(0);
  });
});
