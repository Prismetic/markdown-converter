import { convert, detectFormat } from '@tool/core';
import type { ConversionResult, ConversionStats } from '@tool/core';
import { fileToUint8 } from '../shared/fileToUint8.js';
import { renderStats } from './stats.js';

const MAX_SIZE = 50 * 1024 * 1024;
const SUPPORTED_EXTS = 'docx, xlsx, html, pptx, txt, md, csv, json, xml, pdf';

const dropZone    = document.getElementById('drop-zone')    as HTMLElement;
const fileInput   = document.getElementById('file-input')   as HTMLInputElement;
const spinnerEl   = document.getElementById('spinner')      as HTMLElement;
const outputArea  = document.getElementById('output-area')  as HTMLElement;
const outputEl    = document.getElementById('output')       as HTMLTextAreaElement;
const statsEl     = document.getElementById('stats')        as HTMLElement;
const errorArea   = document.getElementById('error-area')   as HTMLElement;
const copyBtn     = document.getElementById('copy-btn')     as HTMLButtonElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;

let currentFilename = 'output';

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) void handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void handleFile(file);
});

copyBtn.addEventListener('click', () => {
  void navigator.clipboard.writeText(outputEl.value);
});

downloadBtn.addEventListener('click', () => {
  const stem = currentFilename.replace(/\.[^.]+$/, '');
  const blob = new Blob([outputEl.value], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${stem}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
});

async function handleFile(file: File): Promise<void> {
  showError('');
  outputArea.hidden = true;
  statsEl.textContent = '';
  currentFilename = file.name;

  if (file.size > MAX_SIZE) {
    showError('File too large (max 50 MB)');
    return;
  }

  const fmt = detectFormat(file.name);
  if (fmt === null) {
    const dot = file.name.lastIndexOf('.');
    const ext = dot !== -1 ? file.name.slice(dot) : '';
    showError(`Unsupported format${ext ? ': ' + ext : ''}. Supported: ${SUPPORTED_EXTS}`);
    return;
  }

  spinnerEl.hidden = false;
  try {
    const uint8 = await fileToUint8(file);
    let result: ConversionResult;

    if (fmt === 'pdf') {
      result = await convertViaSw(uint8, file.name);
    } else {
      result = await convert(uint8, file.name);
    }

    outputEl.value = result.markdown;
    statsEl.textContent = renderStats(result.stats);
    outputArea.hidden = false;
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  } finally {
    spinnerEl.hidden = true;
  }
}

function convertViaSw(uint8: Uint8Array, filename: string): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'CONVERT_PDF', bytes: Array.from(uint8), filename },
      (response: { type: string; markdown?: string; stats?: ConversionStats; error?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'PDF conversion unavailable'));
          return;
        }
        if (!response || response.type === 'error') {
          reject(new Error(response?.error ?? 'PDF conversion failed'));
          return;
        }
        if (response.markdown == null || response.stats == null) {
          reject(new Error('PDF conversion unavailable'));
          return;
        }
        resolve({ markdown: response.markdown, stats: response.stats });
      },
    );
  });
}

function showError(msg: string): void {
  errorArea.textContent = msg;
  errorArea.hidden = !msg;
}
