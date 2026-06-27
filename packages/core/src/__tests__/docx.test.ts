import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { convertDocx } from '../converters/docx.js';

const WORD_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

async function buildDocx(body: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `</Types>`,
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`,
  );
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
  );
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<w:styles ${WORD_NS}>` +
    `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>` +
    `<w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>` +
    `</w:styles>`,
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<w:document ${WORD_NS}><w:body>${body}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'uint8array' });
}

describe('convertDocx()', () => {
  it('converts Heading1 paragraph to ATX h1 markdown', async () => {
    const bytes = await buildDocx(
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Section Title</w:t></w:r></w:p>`,
    );
    const result = await convertDocx(bytes);
    expect(result.stats.fidelity).toBe('high');
    expect(result.markdown).toContain('# Section Title');
  });

  it('extracts normal paragraph text', async () => {
    const bytes = await buildDocx(`<w:p><w:r><w:t>Body text here.</w:t></w:r></w:p>`);
    const result = await convertDocx(bytes);
    expect(result.markdown).toContain('Body text here.');
  });

  it('converts table to GFM format', async () => {
    const body =
      `<w:tbl>` +
      `<w:tr><w:tc><w:p><w:r><w:t>Col1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Col2</w:t></w:r></w:p></w:tc></w:tr>` +
      `<w:tr><w:tc><w:p><w:r><w:t>Val1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Val2</w:t></w:r></w:p></w:tc></w:tr>` +
      `</w:tbl>`;
    const bytes = await buildDocx(body);
    const result = await convertDocx(bytes);
    expect(result.markdown).toContain('| Col1 |');
    expect(result.markdown).toContain('| Val1 |');
    expect(result.markdown).toContain('---');
  });

  it('returns fidelity:failed for invalid bytes', async () => {
    const result = await convertDocx(new Uint8Array([1, 2, 3, 4]));
    expect(result.stats.fidelity).toBe('failed');
    expect(result.stats.warnings.length).toBeGreaterThan(0);
  });
});
