export class NotImplementedError extends Error {
  constructor(message = "Not implemented") {
    super(message);
    this.name = "NotImplementedError";
  }
}

export type ConversionInput = {
  /** Raw file bytes */
  data: Uint8Array;
  /** MIME type or file extension hint, e.g. "application/pdf" or ".docx" */
  mimeType: string;
};

export type ConversionResult = {
  markdown: string;
  warnings: string[];
};

/**
 * Convert a document buffer to Markdown.
 * Stub — throws NotImplementedError until format converters are wired in.
 */
export function convert(_input: ConversionInput): Promise<ConversionResult> {
  throw new NotImplementedError(
    "convert() is not yet implemented. Format converters will be wired in subsequent subtasks."
  );
}
