export type { FidelityLevel, ConversionStats, ConversionResult, ConvertOpts } from './types.js';
export { detectFormat } from './detect.js';
export type { SupportedFormat } from './detect.js';

import { detectFormat } from './detect.js';
import type { ConversionResult, ConvertOpts } from './types.js';

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

  // Stub: dispatch to converter modules wired in subsequent subtasks (GST-8+)
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
