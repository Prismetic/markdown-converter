import type { ConversionResult } from '../types.js';

export function convertHtml(input: Uint8Array): ConversionResult {
  const start = Date.now();
  const raw = new TextDecoder().decode(input);

  // Strip tags, decode common HTML entities, collapse whitespace.
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const markdown = text;
  return {
    markdown,
    stats: {
      fidelity: 'degraded',
      warnings: ['HTML structure and styling not preserved (text-tier converter)'],
      durationMs: Date.now() - start,
      inputBytes: input.byteLength,
      outputBytes: markdown.length,
    },
  };
}
