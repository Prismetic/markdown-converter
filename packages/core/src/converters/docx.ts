import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConversionResult, ConvertOpts } from '../types.js';

function buildTurndown(): TurndownService {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  td.use(gfm);
  return td;
}

function normalizeDocxHtml(html: string): string {
  // Strip <p> wrappers mammoth adds inside table cells so turndown-plugin-gfm
  // can render them as GFM table rows instead of falling back to raw HTML.
  html = html.replace(/<(td|th)>\s*<p>/gi, '<$1>').replace(/<\/p>\s*<\/(td|th)>/gi, '</$1>');
  // Promote the first row's <td> cells to <th> so the GFM plugin recognises
  // it as a heading row (mammoth never emits <th>).
  html = html.replace(
    /(<table>\s*<tr>)([\s\S]*?)(<\/tr>)/g,
    (_, trOpen: string, cells: string, trClose: string) =>
      trOpen + cells.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>') + trClose,
  );
  return html;
}

export async function convertDocx(
  input: Uint8Array,
  _opts?: ConvertOpts,
): Promise<ConversionResult> {
  const start = Date.now();
  const inputBytes = input.byteLength;

  let htmlResult: { value: string; messages: Array<{ type: string; message: string }> };
  let imageCount = 0;

  try {
    htmlResult = await mammoth.convertToHtml(
      { buffer: input as unknown as Buffer },
      {
        convertImage: mammoth.images.imgElement(async (_image) => {
          imageCount++;
          return { src: '' };
        }),
      },
    );
  } catch (err) {
    return {
      markdown: '',
      stats: {
        fidelity: 'failed',
        warnings: [err instanceof Error ? err.message : String(err)],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: 0,
      },
    };
  }

  const warnings: string[] = htmlResult.messages
    .filter(m => m.type === 'warning' || m.type === 'error')
    .map(m => m.message);

  let html = htmlResult.value;

  if (imageCount > 0) {
    html = html.replace(/<img\b[^>]*>/gi, '<!-- image omitted -->');
    warnings.push(`${imageCount} image(s) omitted`);
  }

  html = normalizeDocxHtml(html);

  const markdown = buildTurndown().turndown(html);

  return {
    markdown,
    stats: {
      fidelity: imageCount > 0 ? 'degraded' : 'high',
      warnings,
      durationMs: Date.now() - start,
      inputBytes,
      outputBytes: markdown.length,
    },
  };
}
