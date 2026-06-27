// Offscreen document — PDF conversion host; pdfjs Worker + relay added in M2
import type { ExtMsg } from '../shared/messages.js';

chrome.runtime.onMessage.addListener(
  (message: ExtMsg, _sender, _sendResponse) => {
    if (message.type === 'CONVERT_PDF') {
      // PDF conversion via pdfjs wired in M2
    }
  }
);
