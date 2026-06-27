// Popup entry — UI shell; @tool/core conversion wired in M2
import { fileToUint8 } from '../shared/fileToUint8.js';

const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const outputArea = document.getElementById('output-area') as HTMLElement;
const outputEl = document.getElementById('output') as HTMLTextAreaElement;
const errorArea = document.getElementById('error-area') as HTMLElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;

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
  const filename = (fileInput.files?.[0]?.name ?? 'output').replace(/\.[^.]+$/, '') + '.md';
  const blob = new Blob([outputEl.value], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
});

async function handleFile(file: File): Promise<void> {
  showError('');
  outputArea.hidden = true;
  // Conversion logic added in M2 — fileToUint8 ready
  await fileToUint8(file);
  showError('Conversion not yet implemented (M2).');
}

function showError(msg: string): void {
  errorArea.textContent = msg;
  errorArea.hidden = !msg;
}
