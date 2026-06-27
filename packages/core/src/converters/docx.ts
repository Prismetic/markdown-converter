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
    /(<table>\s*(?:<tbody>\s*)?<tr>)([\s\S]*?)(<\/tr>)/g,
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

  // mammoth Node.js build accepts { buffer: Buffer | Uint8Array };
  // mammoth browser build requires { arrayBuffer: ArrayBuffer }.
  // Use typeof to detect environment without accessing Buffer properties
  // (which would trigger the purity-test proxy).
  const mammothInput = (
    typeof Buffer !== 'undefined'
      ? { buffer: input as unknown as Buffer }
      : { arrayBuffer: input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) }
  ) as Parameters<typeof mammoth.convertToHtml>[0];

  try {
    htmlResult = await mammoth.convertToHtml(
      mammothInput,
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

  const IMG_PLACEHOLDER = 'IMAGEOMITTEDMARKER';
  if (imageCount > 0) {
    // Use a text placeholder so TurndownService doesn't strip it (HTML comments are discarded).
    // We swap back to a markdown comment after conversion.
    html = html.replace(/<img\b[^>]*>/gi, `<p>${IMG_PLACEHOLDER}</p>`);
    warnings.push(`${imageCount} image(s) omitted`);
  }

  html = normalizeDocxHtml(html);

  let markdown = buildTurndown().turndown(html);
  if (imageCount > 0) {
    markdown = markdown.replace(new RegExp(IMG_PLACEHOLDER, 'g'), '<!-- image omitted -->');
  }

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
