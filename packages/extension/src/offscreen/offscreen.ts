import type { ExtMsg } from '../shared/messages.js';

// Offscreen document: handles PDF conversion (needs DOM for pdfjs)
// pdfjs-dist worker chunk is emitted separately via import.meta.url
// and loaded with GlobalWorkerOptions.workerSrc in the real implementation

// Minimal stub — implementation added in M2
void (0 as unknown as ExtMsg);
