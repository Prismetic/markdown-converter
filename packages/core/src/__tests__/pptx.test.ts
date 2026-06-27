import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { convertPptx } from '../converters/pptx.js';

async function makeMinimalPptx(slides: { texts: string[] }[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    const n = i + 1;
    const atNodes = slides[i].texts
      .map(t => `<a:t>${t}</a:t>`)
      .join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r>${atNodes}</a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
    zip.file(`ppt/slides/slide${n}.xml`, xml);
  }
  const buf = await zip.generateAsync({ type: 'uint8array' });
  return buf;
}

describe('convertPptx()', () => {
  it('extracts text and slide headings', async () => {
    const input = await makeMinimalPptx([
      { texts: ['Hello World', 'Second line'] },
    ]);
    const result = await convertPptx(input);
    expect(result.stats.fidelity).toBe('degraded');
    expect(result.markdown).toContain('## Slide 1');
    expect(result.markdown).toContain('Hello World');
    expect(result.markdown).toContain('Second line');
  });

  it('orders slides numerically', async () => {
    const input = await makeMinimalPptx([
      { texts: ['Slide one text'] },
      { texts: ['Slide two text'] },
      { texts: ['Slide three text'] },
    ]);
    const result = await convertPptx(input);
    const idx1 = result.markdown.indexOf('## Slide 1');
    const idx2 = result.markdown.indexOf('## Slide 2');
    const idx3 = result.markdown.indexOf('## Slide 3');
    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);
  });

  it('decodes XML entities in text', async () => {
    const input = await makeMinimalPptx([{ texts: ['A &amp; B', '&lt;tag&gt;'] }]);
    const result = await convertPptx(input);
    expect(result.markdown).toContain('A & B');
    expect(result.markdown).toContain('<tag>');
  });

  it('returns fidelity:failed on invalid zip', async () => {
    const result = await convertPptx(new Uint8Array([0x00, 0x01, 0x02]));
    expect(result.stats.fidelity).toBe('failed');
    expect(result.markdown).toBe('');
  });

  it('handles empty slides gracefully', async () => {
    const input = await makeMinimalPptx([{ texts: [] }, { texts: ['Only second'] }]);
    const result = await convertPptx(input);
    expect(result.markdown).toContain('## Slide 1');
    expect(result.markdown).toContain('## Slide 2');
    expect(result.markdown).toContain('Only second');
  });

  it('sets outputBytes to markdown length', async () => {
    const input = await makeMinimalPptx([{ texts: ['Test'] }]);
    const result = await convertPptx(input);
    expect(result.stats.outputBytes).toBe(result.markdown.length);
  });
});
