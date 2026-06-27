export type FidelityLevel = 'high' | 'degraded' | 'failed';

export interface ConversionStats {
  fidelity: FidelityLevel;
  warnings: string[];
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
}

export interface ConversionResult {
  markdown: string;
  stats: ConversionStats;
}

export interface ConvertOpts {
  outline_depth?: number;
  excerpt_length?: number;
}
