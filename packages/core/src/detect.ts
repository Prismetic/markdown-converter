export type SupportedFormat =
  | 'docx' | 'xlsx' | 'html' | 'pdf' | 'pptx'
  | 'txt'  | 'md'   | 'csv'  | 'json' | 'xml';

const EXTENSION_MAP: Record<string, SupportedFormat> = {
  docx: 'docx',
  xlsx: 'xlsx',
  html: 'html',
  htm:  'html',
  pdf:  'pdf',
  pptx: 'pptx',
  txt:  'txt',
  md:   'md',
  csv:  'csv',
  json: 'json',
  xml:  'xml',
};

export function detectFormat(filename: string): SupportedFormat | null {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === filename.length - 1) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}
