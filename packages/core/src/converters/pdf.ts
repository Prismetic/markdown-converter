import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import { createRequire } from 'node:module';
import type { TextItem } from 'pdfjs-dist/types/src/display/api.js';
import type { ConversionResult } from '../types.js';

// Resolve the pdfjs worker so it can run inline (no Worker thread) in Node.js.
// createRequire(import.meta.url) is supported by vitest's SSR transform; it's
// the portable ESM alternative to import.meta.resolve which vite doesn't expose.
const _require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = _require.resolve('pdfjs-dist/build/pdf.worker.mjs');

export async function convertPdf(input: Uint8Array): Promise<ConversionResult> {
  const start = Date.now();
  const inputBytes = input.byteLength;

  try {
    const loadingTask = getDocument({ data: input.slice(0), useSystemFonts: true, disableFontFace: true });
    const pdf = await loadingTask.promise;

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const lines: string[] = [];
      for (const item of textContent.items) {
        if ('str' in item) {
          const ti = item as TextItem;
          if (ti.str.trim()) lines.push(ti.str);
        }
      }
      if (lines.length > 0) pageTexts.push(lines.join('\n'));
    }

    const markdown = pageTexts.join('\n\n---\n\n');

    return {
      markdown,
      stats: {
        fidelity: 'degraded',
        warnings: ['Layout not reconstructed (text-tier converter)'],
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
        warnings: [`PDF extraction failed: ${err instanceof Error ? err.message : String(err)}`],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: 0,
      },
    };
  }
}
