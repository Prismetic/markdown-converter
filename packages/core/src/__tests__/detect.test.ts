import { describe, it, expect } from 'vitest';
import { detectFormat } from '../detect.js';

describe('detectFormat', () => {
  it.each([
    ['document.docx', 'docx'],
    ['sheet.xlsx',    'xlsx'],
    ['page.html',     'html'],
    ['page.htm',      'html'],
    ['file.pdf',      'pdf'],
    ['slides.pptx',   'pptx'],
    ['notes.txt',     'txt'],
    ['readme.md',     'md'],
    ['data.csv',      'csv'],
    ['config.json',   'json'],
    ['feed.xml',      'xml'],
  ] as const)('%s → %s', (filename, expected) => {
    expect(detectFormat(filename)).toBe(expected);
  });

  it('returns null for unknown extension', () => {
    expect(detectFormat('file.xyz')).toBeNull();
    expect(detectFormat('file.foo')).toBeNull();
    expect(detectFormat('archive.tar')).toBeNull();
  });

  it('returns null when there is no extension', () => {
    expect(detectFormat('Makefile')).toBeNull();
    expect(detectFormat('README')).toBeNull();
  });

  it('returns null for trailing-dot filenames', () => {
    expect(detectFormat('file.')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectFormat('file.DOCX')).toBe('docx');
    expect(detectFormat('file.PDF')).toBe('pdf');
    expect(detectFormat('file.JSON')).toBe('json');
  });

  it('uses the last extension for dotted names', () => {
    expect(detectFormat('archive.backup.json')).toBe('json');
  });
});
