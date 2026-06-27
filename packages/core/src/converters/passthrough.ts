import type { ConversionResult } from '../types.js';

export function convertTxt(input: Uint8Array): ConversionResult {
  const start = Date.now();
  const markdown = new TextDecoder().decode(input).trim();
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

export function convertMd(input: Uint8Array): ConversionResult {
  const start = Date.now();
  const markdown = new TextDecoder().decode(input);
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
