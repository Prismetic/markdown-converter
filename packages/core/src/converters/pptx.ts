import JSZip from 'jszip';
import type { ConversionResult } from '../types.js';

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export async function convertPptx(input: Uint8Array): Promise<ConversionResult> {
  const start = Date.now();
  const inputBytes = input.byteLength;

  try {
    const zip = await JSZip.loadAsync(input);

    const slideEntries = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)![1]);
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)![1]);
        return numA - numB;
      });

    const sections: string[] = [];

    for (let i = 0; i < slideEntries.length; i++) {
      const xml = await zip.files[slideEntries[i]].async('string');

      const texts: string[] = [];
      const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(xml)) !== null) {
        const text = decodeXmlEntities(m[1]).trim();
        if (text) texts.push(text);
      }

      sections.push(`## Slide ${i + 1}${texts.length > 0 ? '\n\n' + texts.join('\n') : ''}`);
    }

    const markdown = sections.join('\n\n');

    return {
      markdown,
      stats: {
        fidelity: 'degraded',
        warnings: ['Images not extracted (text-tier converter)'],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: markdown.length,
      },
    };
  } catch (err) {
    return {
      markdown: '',
      stats: {
        fidelity: 'failed',
        warnings: [`PPTX extraction failed: ${err instanceof Error ? err.message : String(err)}`],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: 0,
      },
    };
  }
}
