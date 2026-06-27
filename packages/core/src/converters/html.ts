import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConversionResult, ConvertOpts } from '../types.js';

export async function convertHtml(
  input: Uint8Array,
  _opts?: ConvertOpts,
): Promise<ConversionResult> {
  const start = Date.now();

  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  td.use(gfm);

  const raw = new TextDecoder().decode(input);
  // Strip script/style blocks before turndown so their content doesn't appear as text.
  const html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const markdown = td.turndown(html);

  return {
    markdown,
    stats: {
      fidelity: 'high',
      warnings: [],
      durationMs: Date.now() - start,
      inputBytes: input.byteLength,
      outputBytes: markdown.length,
    },
  };
}
