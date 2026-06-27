export type { ConversionStats } from '@tool/core';

import type { ConversionStats } from '@tool/core';

export type ExtMsg =
  | { type: 'convert'; file: Uint8Array; filename: string }
  | { type: 'result'; markdown: string; stats?: ConversionStats }
  | { type: 'error'; error: string };
