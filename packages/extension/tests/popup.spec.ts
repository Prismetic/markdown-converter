import { test as base, expect, chromium } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXTENSION_DIR = resolve(__dirname, '..', '_dist');
const INPUTS_DIR = resolve(__dirname, '..', '..', 'core', 'golden', 'inputs');
const SNAPSHOTS_DIR = join(__dirname, '..', '..', 'core', 'golden', 'snapshots');

// ------------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------------

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

const test = base.extend<ExtensionFixtures>({
  // Launch a persistent Chrome context with the packed extension loaded.
  context: async ({}, use) => {
    const args = [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ];
    if (process.env.CI) {
      // New headless mode supports extension loading (Chrome 112+).
      args.push('--headless=new');
    }
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args,
    });
    await use(context);
    await context.close();
  },

  // Resolve the extension ID from the registered service worker URL.
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    const id = new URL(sw.url()).hostname;
    await use(id);
  },

  // Override page to use the persistent context.
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').trimEnd();
}

function goldenSnapshot(ext: string): string {
  return readFileSync(join(SNAPSHOTS_DIR, `sample.${ext}.md`), 'utf8');
}

// ------------------------------------------------------------------
// 10-format E2E spec
// ------------------------------------------------------------------

const FORMATS = [
  'docx', 'xlsx', 'html', 'pdf', 'pptx',
  'txt', 'md', 'csv', 'json', 'xml',
] as const;

for (const fmt of FORMATS) {
  test(`popup converts .${fmt} to markdown`, async ({ page, extensionId }) => {
    // 1. Open popup via chrome-extension:// URL (Vite preserves src/ hierarchy in dist)
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // 2. Drop golden fixture via the file input
    const fixtureFile = join(INPUTS_DIR, `sample.${fmt}`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixtureFile);

    // 3. Wait for markdown output in <textarea>
    const outputArea = page.locator('textarea');
    await outputArea.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(outputArea).not.toHaveValue('', { timeout: 30_000 });

    // 4. Assert output === golden snapshot (byte-identical after newline normalization)
    const actual = normalize(await outputArea.inputValue());
    const expected = normalize(goldenSnapshot(fmt));
    expect(actual).toBe(expected);

    // 5. Assert stats.fidelity !== 'failed'
    const statsEl = page.locator('[data-testid="stats"]');
    await expect(statsEl).toBeVisible({ timeout: 5_000 });
    await expect(statsEl).not.toContainText('failed');

    // 6. Assert "Copy to Clipboard" is visible and enabled
    const copyBtn = page.getByRole('button', { name: /copy to clipboard/i });
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();

    // 7. Assert "Download .md" triggers a download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download \.md/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });
}
