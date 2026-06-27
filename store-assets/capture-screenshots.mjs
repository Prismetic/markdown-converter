/**
 * Captures 5 CWS-ready screenshots (1280x800) of the Markdown Converter popup.
 * Run from the repo root: node store-assets/capture-screenshots.mjs
 *
 * Output: store-assets/screenshots/01-*.png … 05-*.png
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = resolve(__dirname, '..', 'packages', 'extension', '_dist');
const INPUTS_DIR   = resolve(__dirname, '..', 'packages', 'core', 'golden', 'inputs');
const OUT_DIR      = resolve(__dirname, 'screenshots');

mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };

const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [
    '--headless=new',
    `--disable-extensions-except=${EXTENSION_DIR}`,
    `--load-extension=${EXTENSION_DIR}`,
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
  viewport: VIEWPORT,
});

let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');
const extensionId = new URL(sw.url()).hostname;
const POPUP = `chrome-extension://${extensionId}/src/popup/popup.html`;

async function openPopup() {
  const page = await context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(POPUP);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

async function convertFile(page, filename) {
  await page.locator('input[type="file"]').setInputFiles(join(INPUTS_DIR, filename));
  const ta = page.locator('textarea');
  await ta.waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(300);  // let stats render
}

// --- Screenshot 1: initial / welcome state ---
{
  const page = await openPopup();
  await page.screenshot({ path: join(OUT_DIR, '01-initial-state.png') });
  console.log('✓ 01-initial-state.png');
  await page.close();
}

// --- Screenshot 2: DOCX → Markdown ---
{
  const page = await openPopup();
  await convertFile(page, 'sample.docx');
  await page.screenshot({ path: join(OUT_DIR, '02-docx-to-markdown.png') });
  console.log('✓ 02-docx-to-markdown.png');
  await page.close();
}

// --- Screenshot 3: PDF → Markdown ---
{
  const page = await openPopup();
  await convertFile(page, 'sample.pdf');
  await page.screenshot({ path: join(OUT_DIR, '03-pdf-to-markdown.png') });
  console.log('✓ 03-pdf-to-markdown.png');
  await page.close();
}

// --- Screenshot 4: XLSX → Markdown ---
{
  const page = await openPopup();
  await convertFile(page, 'sample.xlsx');
  await page.screenshot({ path: join(OUT_DIR, '04-xlsx-to-markdown.png') });
  console.log('✓ 04-xlsx-to-markdown.png');
  await page.close();
}

// --- Screenshot 5: HTML → Markdown ---
{
  const page = await openPopup();
  await convertFile(page, 'sample.html');
  await page.screenshot({ path: join(OUT_DIR, '05-html-to-markdown.png') });
  console.log('✓ 05-html-to-markdown.png');
  await page.close();
}

await context.close();
console.log(`\nAll 5 screenshots written to ${OUT_DIR}`);
