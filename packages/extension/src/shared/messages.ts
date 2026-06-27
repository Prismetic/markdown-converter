export interface ConversionStats {
  fidelity: 'high' | 'degraded' | 'failed';
  warnings: string[];
  durationMs: number;
  inputBytes: number;
}

export type ExtMsg =
  | { type: 'CONVERT_PDF'; payload: { bytes: number[]; filename: string } }
  | { type: 'CONVERT_PDF_RESULT'; markdown: string; stats: ConversionStats }
  | { type: 'CONVERT_PDF_ERROR'; error: string };
