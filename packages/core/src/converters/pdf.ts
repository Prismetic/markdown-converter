import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api.js';
import type { ConversionResult } from '../types.js';

// Lazily resolve the pdfjs worker path — Node.js only.
// In browsers this block is never reached; node:module stays external in the
// browser ESM bundle so the dynamic import below doesn't get inlined.
let _workerSrcPromise: Promise<void> | null = null;
function ensureWorkerSrc(): Promise<void> {
  if (!_workerSrcPromise) _workerSrcPromise = _resolveWorkerSrc();
  return _workerSrcPromise;
}
async function _resolveWorkerSrc(): Promise<void> {
  if (typeof process !== 'undefined' && typeof process.versions?.node === 'string') {
    const { createRequire } = await import('node:module');
    const _require = createRequire(import.meta.url);
    GlobalWorkerOptions.workerSrc = _require.resolve('pdfjs-dist/build/pdf.worker.mjs');
  }
}

/** Let callers in non-Node contexts (e.g. extension offscreen doc) set the pdfjs
 *  worker URL before the first conversion. Must be called with a URL in the same
 *  origin as the caller (chrome.runtime.getURL(...) in extensions). */
export function setPdfWorkerSrc(src: string): void {
  GlobalWorkerOptions.workerSrc = src;
}

export async function convertPdf(input: Uint8Array): Promise<ConversionResult> {
  await ensureWorkerSrc();
  const start = Date.now();
  const inputBytes = input.byteLength;

  try {
    const loadingTask = getDocument({ data: input.slice(0), useSystemFonts: true, disableFontFace: true });
    const pdf = await loadingTask.promise;

    let markdown = '';
    try {
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

      markdown = pageTexts.join('\n\n---\n\n');
    } finally {
      await pdf.destroy();
    }

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
