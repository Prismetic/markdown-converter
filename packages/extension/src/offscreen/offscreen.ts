import { convert, setPdfWorkerSrc } from '@tool/core';
import type { ExtMsg } from '../shared/messages.js';

// pdfjs 4.x requires workerSrc; configure it to the copy bundled in public/.
// Must use chrome.runtime.getURL so the worker has the same chrome-extension://
// origin as this offscreen document (pdfjs enforces same-origin for workers).
if (typeof chrome !== 'undefined' && typeof chrome.runtime?.getURL === 'function') {
  setPdfWorkerSrc(chrome.runtime.getURL('pdf.worker.min.mjs'));
}

chrome.runtime.onMessage.addListener(
  (message: ExtMsg, _sender, sendResponse: (r: ExtMsg) => void) => {
    if (message.type !== 'CONVERT_PDF' || message.target !== 'offscreen') return;

    const { bytes, filename } = message.payload;
    const uint8 = new Uint8Array(bytes);

    void (async () => {
      try {
        const result = await convert(uint8, filename);
        sendResponse({ type: 'CONVERT_PDF_RESULT', markdown: result.markdown, stats: result.stats });
      } catch (e) {
        sendResponse({
          type: 'CONVERT_PDF_ERROR',
          error: e instanceof Error ? e.message : 'PDF conversion failed',
        });
      }
    })();

    return true; // async sendResponse
  },
);
