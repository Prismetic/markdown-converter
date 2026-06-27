import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  root: '.',
  build: {
    outDir: '_dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true,
      },
      mangle: {
        safari10: false,
      },
    },
    rollupOptions: {
      output: {
        // Keep chunks co-located in extension dist — MV3 restricts remote imports
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
  // pdfjs-dist emits its worker separately via import.meta.url in offscreen context
  worker: {
    format: 'es',
  },
  plugins: [
    webExtension({
      manifest: 'manifest.json',
      // Offscreen doc is not referenced in manifest; must be declared explicitly
      additionalInputs: ['src/offscreen/offscreen.html'],
      browser: 'chrome',
    }),
  ],
});
