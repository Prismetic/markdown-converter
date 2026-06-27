#!/usr/bin/env node
/**
 * Flagless CLI harness for @tool/core.
 * Stub — exits 1 until the convert() router is implemented.
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const pkg = _require("../dist/node/index.cjs");

console.error("Usage: cat <file> | node tools/run-core.js <mimeType>");
console.error("");
console.error("Example:");
console.error("  cat document.docx | node tools/run-core.js application/vnd.openxmlformats-officedocument.wordprocessingml.document");
console.error("");
console.error("Status: not implemented (converter not yet wired — see GST-7)");

process.exit(1);
