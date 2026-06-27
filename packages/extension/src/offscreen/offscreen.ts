import { convert } from '@tool/core';
import type { ExtMsg } from '../shared/messages.js';

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
