// Ambient type declarations for @tool/core (no .d.ts emitted by the core package).
// Keep in sync with packages/core/src/types.ts and packages/core/src/detect.ts.
declare module '@tool/core' {
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

  export type SupportedFormat =
    | 'docx'
    | 'xlsx'
    | 'html'
    | 'pdf'
    | 'pptx'
    | 'txt'
    | 'md'
    | 'csv'
    | 'json'
    | 'xml';

  export function detectFormat(filename: string): SupportedFormat | null;

  export function convert(
    input: Uint8Array,
    filename: string,
    opts?: ConvertOpts,
  ): Promise<ConversionResult>;
}
