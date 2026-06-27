import type { ExtMsg } from '../shared/messages.js';

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => {
  void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

async function ensureOffscreenDoc(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'PDF conversion via pdfjs-dist web worker',
  }).catch(async (e: unknown) => {
    // Guard against TOCTOU: another concurrent call may have created the doc first.
    if (!(await chrome.offscreen.hasDocument())) throw e;
  });
}

chrome.runtime.onMessage.addListener(
  (message: ExtMsg, _sender, sendResponse: (r: ExtMsg) => void) => {
    if (message.type !== 'CONVERT_PDF' || message.target === 'offscreen') return;

    void (async () => {
      try {
        await ensureOffscreenDoc();
        const fwdMsg: ExtMsg = {
          type: 'CONVERT_PDF',
          payload: message.payload,
          target: 'offscreen',
        };
        const result = await chrome.runtime.sendMessage(fwdMsg) as ExtMsg | undefined;
        sendResponse(result ?? { type: 'CONVERT_PDF_ERROR', error: 'No response from offscreen' });
      } catch (e) {
        sendResponse({
          type: 'CONVERT_PDF_ERROR',
          error: e instanceof Error ? e.message : 'PDF conversion unavailable',
        });
      }
    })();

    return true; // keep sendResponse channel open for async reply
  },
);
