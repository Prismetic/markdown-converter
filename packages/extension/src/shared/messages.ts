export type { ConversionStats } from '@tool/core';

import type { ConversionStats } from '@tool/core';

export type ExtMsg =
  | { type: 'CONVERT_PDF'; payload: { bytes: number[]; filename: string }; target?: 'offscreen' }
  | { type: 'CONVERT_PDF_RESULT'; markdown: string; stats: ConversionStats }
  | { type: 'CONVERT_PDF_ERROR'; error: string };
