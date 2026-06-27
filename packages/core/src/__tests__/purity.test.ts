// @vitest-environment happy-dom
/**
 * Purity test suite — verifies that our converter SOURCE CODE never directly
 * calls Node-only globals (Buffer, __dirname, __filename).
 *
 * Design notes:
 * - Uses a TRACKING proxy (not a throwing proxy) so the vitest/tsx worker IPC,
 *   which also uses Buffer for test-result serialization, doesn't crash.
 * - Restores globals INSIDE finally{} so the proxy is removed before vitest
 *   communicates test results to the parent process.
 * - Checks that the DIRECT caller of Buffer is our src/converters/ code, not a
 *   library (mammoth, SheetJS, JSZip all use Buffer in Node but have browser
 *   builds — those accesses are not purity violations in our code).
 * - PDF is excluded: its worker-path resolution intentionally uses node:module.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { convert } from "../index.js";
import type { ConversionResult } from "../index.js";

// ─── Basic API shape (no poison needed) ──────────────────────────────────────

describe("@tool/core: module surface", () => {
  it("exports convert() and detectFormat()", async () => {
    const mod = await import("../index.js");
    expect(mod.convert).toBeTypeOf("function");
    expect(mod.detectFormat).toBeTypeOf("function");
  });
});

// ─── Purity helpers ───────────────────────────────────────────────────────────

const GOLDEN_DIR = join(import.meta.dirname, "..", "..", "golden");

function loadInput(ext: string): Uint8Array {
  const buf = readFileSync(join(GOLDEN_DIR, "inputs", `sample.${ext}`));
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

const POISON_KEYS = ["Buffer", "__dirname", "__filename"] as const;
type PoisonKey = (typeof POISON_KEYS)[number];

/**
 * Runs fn() with tracking proxies installed on Node-only globals.
 * Returns the conversion result and any violation detected.
 *
 * A violation is recorded only when the DIRECT caller of the global
 * is our source code in src/converters/ (not a library in node_modules).
 * This prevents false positives from libraries that have browser builds.
 *
 * Globals are always restored in finally{} so vitest's IPC can proceed.
 */
async function runPure(fn: () => Promise<ConversionResult>): Promise<{
  result: ConversionResult;
  violation: string | null;
}> {
  let violation: string | null = null;
  const saved: Partial<Record<PoisonKey, unknown>> = {};

  for (const key of POISON_KEYS) {
    const val = (globalThis as Record<string, unknown>)[key];
    saved[key] = val;
    const proxyTarget = (val as object) ?? {};
    (globalThis as Record<string, unknown>)[key] = new Proxy(proxyTarget, {
      get(target, prop) {
        // frames[0] after slice(2) is the DIRECT caller of this property access
        // (the code that wrote `Buffer.from(...)`). Libraries like JSZip call
        // Buffer.from synchronously, leaving our converter frame further up the
        // stack — so checking only frames[0] avoids false positives from libraries.
        const frames = (new Error().stack ?? "").split("\n").slice(2);
        const directCaller = frames[0] ?? "";
        if (
          directCaller.includes("/src/converters/") &&
          !directCaller.includes("/node_modules/")
        ) {
          violation ??= `${key}.${String(prop)} accessed from converter: ${directCaller.trim()}`;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  let result: ConversionResult;
  try {
    result = await fn();
  } finally {
    // Always restore globals BEFORE control returns to vitest,
    // so test-result IPC (which uses Buffer) works.
    for (const key of POISON_KEYS) {
      (globalThis as Record<string, unknown>)[key] = saved[key];
    }
  }

  return { result: result!, violation };
}

// ─── Purity: one test per format ─────────────────────────────────────────────

describe("purity: format converters must not call Node globals", () => {
  it("txt → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("txt"), "sample.txt"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown.length).toBeGreaterThan(0);
  });

  it("md → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("md"), "sample.md"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown.length).toBeGreaterThan(0);
  });

  it("csv → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("csv"), "sample.csv"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown).toContain("|");
  });

  it("json → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("json"), "sample.json"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown).toContain("```json");
  });

  it("xml → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("xml"), "sample.xml"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown).toContain("```xml");
  });

  it("html → markdown does not directly access Node globals", async () => {
    const { result, violation } = await runPure(() =>
      convert(loadInput("html"), "sample.html"),
    );
    expect(violation, violation ?? "").toBeNull();
    // happy-dom's DOMParser + turndown may produce empty output but the
    // conversion must not error (fidelity: 'high' = turndown succeeded).
    expect(result.stats.fidelity).toBe("high");
  });

  it("docx → markdown does not directly access Node globals", async () => {
    // mammoth uses Buffer internally in Node (it has a browser build that doesn't);
    // the proxy only flags direct access from src/converters/, not from node_modules.
    const { result, violation } = await runPure(() =>
      convert(loadInput("docx"), "sample.docx"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.stats.fidelity).not.toBe("failed");
    expect(result.markdown).toContain("Sample Document Heading");
  });

  it("xlsx → markdown does not directly access Node globals", async () => {
    // SheetJS uses Buffer in Node (has browser build); same filtering applies.
    const { result, violation } = await runPure(() =>
      convert(loadInput("xlsx"), "sample.xlsx"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown).toContain("|");
  });

  it("pptx → markdown does not directly access Node globals", async () => {
    // JSZip conditionally uses Buffer.from in Node (browser build omits this).
    const { result, violation } = await runPure(() =>
      convert(loadInput("pptx"), "sample.pptx"),
    );
    expect(violation, violation ?? "").toBeNull();
    expect(result.markdown).toContain("Slide");
  });

  // pdf is intentionally excluded: pdf.ts uses node:module to resolve the
  // pdfjs worker path in Node; that is a known, documented limitation.
});
