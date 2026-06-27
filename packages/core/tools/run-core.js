#!/usr/bin/env node
/**
 * CLI harness for @tool/core.
 * Usage: node tools/run-core.js <file>
 * Reads the file, converts it, and prints the markdown to stdout.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node tools/run-core.js <file>");
  process.exit(1);
}

const _require = createRequire(import.meta.url);
const { convert } = _require("../dist/node/index.cjs");

const buf = readFileSync(filePath);
const filename = filePath.replace(/.*[\\/]/, "");

const result = await convert(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), filename);

if (result.stats.warnings.length > 0) {
  for (const w of result.stats.warnings) {
    process.stderr.write(`[warn] ${w}\n`);
  }
}

process.stdout.write(result.markdown + "\n");
process.stderr.write(
  `[info] fidelity=${result.stats.fidelity} inputBytes=${result.stats.inputBytes} outputBytes=${result.stats.outputBytes} durationMs=${result.stats.durationMs}\n`,
);

if (result.stats.fidelity === "failed") {
  process.exit(1);
}
