import { describe, it, expect } from 'vitest';
import { convertHtml } from '../converters/html.js';

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('convertHtml()', () => {
  it('strips tags and returns visible text', () => {
    const result = convertHtml(enc('<h1>Hello</h1><p>World</p>'));
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.markdown).toContain('Hello');
    expect(result.markdown).toContain('World');
    expect(result.markdown).not.toContain('<h1>');
  });

  it('removes <script> and <style> blocks entirely', () => {
    const result = convertHtml(enc('<style>body{color:red}</style><p>Text</p><script>alert(1)</script>'));
    expect(result.markdown).not.toContain('color:red');
    expect(result.markdown).not.toContain('alert');
    expect(result.markdown).toContain('Text');
  });

  it('decodes common HTML entities', () => {
    const result = convertHtml(enc('<p>A &amp; B &lt;tag&gt; &quot;quoted&quot;</p>'));
    expect(result.markdown).toContain('A & B');
    expect(result.markdown).toContain('<tag>');
    expect(result.markdown).toContain('"quoted"');
  });

  it('sets outputBytes to markdown length', () => {
    const result = convertHtml(enc('<p>Test</p>'));
    expect(result.stats.outputBytes).toBe(result.markdown.length);
  });

  it('sets fidelity to degraded (not high)', () => {
    const result = convertHtml(enc('<p>x</p>'));
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.stats.fidelity).not.toBe('high');
  });
});
