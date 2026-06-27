// Offscreen document — PDF conversion host using pdfjs-dist
import { convert } from '@tool/core';
import type { ConversionResult } from '@tool/core';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'OFFSCREEN_CONVERT') return;

  void (async () => {
    try {
      const uint8 = new Uint8Array(message.bytes as number[]);
      const result: ConversionResult = await convert(uint8, message.filename as string);
      sendResponse({ type: 'result', markdown: result.markdown, stats: result.stats });
    } catch (e) {
      sendResponse({
        type: 'error',
        error: e instanceof Error ? e.message : 'PDF conversion failed',
      });
    }
  })();

  return true; // keep sendResponse channel open for async reply
});
