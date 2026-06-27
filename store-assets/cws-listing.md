# CWS Listing Copy — Markdown Converter

## Name
Markdown Converter

## Short description (132 chars max — current: 95 chars)
Convert DOCX, PDF, XLSX, HTML and 6 more formats to Markdown — locally, with zero network access.

## Category
Productivity

## Detailed description

Markdown Converter converts your files to clean Markdown right inside your browser — nothing is ever sent to a server.

**Supported formats**
- DOCX — Microsoft Word documents
- PDF — text-layer extraction (no OCR)
- XLSX — Microsoft Excel spreadsheets (tables → GFM)
- HTML — web pages and fragments
- PPTX — PowerPoint presentations (slide text)
- CSV — spreadsheet data (tables → GFM)
- JSON — pretty-printed with code fence
- XML — pretty-printed with code fence
- TXT — passthrough
- MD — passthrough / re-serialise

**How it works**
1. Click the extension icon.
2. Drop a file (or click to browse).
3. Copy the Markdown output — or download it.

**Privacy guarantee**
Every conversion runs locally using WebAssembly and JavaScript. Your file never leaves your device. No analytics, no telemetry, no cookies, no network requests.

**Requirements**
Chrome 120 or later.

---

## Privacy Policy URL

https://prismetic.github.io/markdown-converter/privacy-policy.html

## Pre-submit checklist

- [x] Extension zip ≤ 2 MB  (735 KB)
- [x] No host permissions in manifest
- [x] No external network calls
- [x] Privacy policy URL resolves publicly  → https://prismetic.github.io/markdown-converter/privacy-policy.html
- [ ] All 5 screenshots uploaded (1280×800 or 640×400 px)
- [x] icons/icon32.png present
- [x] icons/icon128.png present
- [x] manifest.json has `homepage_url`, `author`, `minimum_chrome_version: "120"`

## Screenshot plan (5 required, 1280×800 or 640×400)

1. **Popup — empty state** — extension popup before any file is loaded, showing the drop zone
2. **Popup — DOCX loaded** — popup showing a DOCX file queued for conversion
3. **Markdown output** — the converted markdown result displayed in the output panel
4. **Format list** — dropdown or format selector showing all 10 supported formats
5. **Copy/download** — output panel with copy-to-clipboard and download buttons highlighted
