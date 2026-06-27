import { describe, test, expect } from 'vitest';
import { detectFormat } from '@tool/core';

describe('detectFormat', () => {
  const cases: [string, string | null][] = [
    ['sample.docx', 'docx'],
    ['sample.xlsx', 'xlsx'],
    ['sample.html', 'html'],
    ['sample.htm',  'html'],
    ['sample.pdf',  'pdf'],
    ['sample.pptx', 'pptx'],
    ['sample.txt',  'txt'],
    ['sample.md',   'md'],
    ['sample.csv',  'csv'],
    ['sample.json', 'json'],
    ['sample.xml',  'xml'],
  ];

  for (const [filename, expected] of cases) {
    test(`detects ${filename} as ${expected}`, () => {
      expect(detectFormat(filename)).toBe(expected);
    });
  }

  test('returns null for unsupported extension', () => {
    expect(detectFormat('file.exe')).toBeNull();
    expect(detectFormat('file.mp4')).toBeNull();
    expect(detectFormat('file.zip')).toBeNull();
  });

  test('returns null for filename with no extension', () => {
    expect(detectFormat('README')).toBeNull();
    expect(detectFormat('')).toBeNull();
  });

  test('is case-insensitive', () => {
    expect(detectFormat('REPORT.DOCX')).toBe('docx');
    expect(detectFormat('data.JSON')).toBe('json');
    expect(detectFormat('sheet.XLSX')).toBe('xlsx');
  });

  test('handles path with directory separators', () => {
    expect(detectFormat('/home/user/docs/report.docx')).toBe('docx');
    expect(detectFormat('C:\\Users\\file.pdf')).toBe('pdf');
  });
});
