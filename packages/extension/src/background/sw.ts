// MV3 service worker — lifecycle + PDF relay via offscreen doc
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
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CONVERT_PDF') return;

  void (async () => {
    try {
      await ensureOffscreenDoc();
      const result: unknown = await chrome.runtime.sendMessage({
        type: 'OFFSCREEN_CONVERT',
        bytes: message.bytes as number[],
        filename: message.filename as string,
      });
      sendResponse(result);
    } catch (e) {
      sendResponse({
        type: 'error',
        error: e instanceof Error ? e.message : 'PDF conversion unavailable',
      });
    }
  })();

  return true; // keep sendResponse channel open for async reply
});
