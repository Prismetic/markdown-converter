export type { FidelityLevel, ConversionStats, ConversionResult, ConvertOpts } from './types.js';
export { detectFormat } from './detect.js';
export type { SupportedFormat } from './detect.js';

import { detectFormat } from './detect.js';
import type { ConversionResult, ConvertOpts } from './types.js';
import { convertTxt, convertMd } from './converters/passthrough.js';
import { convertCsv, convertJson, convertXml } from './converters/structured.js';
import { convertHtml } from './converters/html.js';
import { convertPptx } from './converters/pptx.js';
import { convertPdf } from './converters/pdf.js';

export async function convert(
  input: Uint8Array,
  filename: string,
  _opts?: ConvertOpts
): Promise<ConversionResult> {
  const start = Date.now();
  const inputBytes = input.byteLength;
  const format = detectFormat(filename);

  if (format === null) {
    const dot = filename.lastIndexOf('.');
    const ext = dot !== -1 ? filename.slice(dot) : filename;
    return {
      markdown: '',
      stats: {
        fidelity: 'failed',
        warnings: [`Unsupported format: ${ext}`],
        durationMs: Date.now() - start,
        inputBytes,
        outputBytes: 0,
      },
    };
  }

  switch (format) {
    case 'txt':  return convertTxt(input);
    case 'md':   return convertMd(input);
    case 'csv':  return convertCsv(input);
    case 'json': return convertJson(input);
    case 'xml':  return convertXml(input);
    case 'html': return convertHtml(input);
    case 'pptx': return convertPptx(input);
    case 'pdf':  return convertPdf(input);
    default:
      return {
        markdown: '',
        stats: {
          fidelity: 'failed',
          warnings: [`Converter for ${format} not yet implemented`],
          durationMs: Date.now() - start,
          inputBytes,
          outputBytes: 0,
        },
      };
  }
}
