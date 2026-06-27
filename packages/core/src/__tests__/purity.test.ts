// @vitest-environment happy-dom
/**
 * Purity test suite — verifies that browser-targeted code never calls Node-only globals.
 *
 * The poison proxy intercepts any access to banned globals and throws immediately,
 * making it impossible for browser bundle code to silently depend on Node APIs.
 *
 * HOW TO ACTIVATE: When wiring a new format converter (GST-8+), change
 * `describe.skip` → `describe` on the poisoned section, then add your
 * format test. The `beforeAll`/`afterAll` hooks take care of the rest.
 *
 * Individual format tests are skipped until converters exist.
 */

import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";

// ─── Poison machinery ────────────────────────────────────────────────────────

/** Globals that must never be accessed in browser-targeted code. */
const NODE_POISON_GLOBALS = [
  "Buffer",
  "__dirname",
  "__filename",
  "require",
] as const;

type PoisonedKey = (typeof NODE_POISON_GLOBALS)[number];

function makePoisonProxy(name: string): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(
          `[purity] Illegal access to Node-only global "${name}.${String(prop)}" in browser context`
        );
      },
      apply() {
        throw new Error(
          `[purity] Illegal call to Node-only global "${name}()" in browser context`
        );
      },
    }
  );
}

function installPoison(): () => void {
  const saved: Partial<Record<PoisonedKey, unknown>> = {};
  for (const key of NODE_POISON_GLOBALS) {
    saved[key] = (globalThis as Record<string, unknown>)[key];
    (globalThis as Record<string, unknown>)[key] = makePoisonProxy(key);
  }
  return () => {
    for (const key of NODE_POISON_GLOBALS) {
      (globalThis as Record<string, unknown>)[key] = saved[key];
    }
  };
}

// ─── Basic API shape (no poison needed) ──────────────────────────────────────

describe("@tool/core: module surface", () => {
  it("exports convert() and detectFormat()", async () => {
    const mod = await import("../index.js");
    expect(mod.convert).toBeTypeOf("function");
    expect(mod.detectFormat).toBeTypeOf("function");
  });
});

// ─── Purity: Node-global poison (all format tests deferred) ──────────────────
//
// Change `describe.skip` → `describe` to activate the poisoner, then add the
// format test that covers your converter.

describe.skip("purity: format converters must not call Node globals", () => {
  let restoreGlobals: () => void;

  beforeAll(() => {
    restoreGlobals = installPoison();
  });

  afterAll(() => {
    restoreGlobals?.();
  });

  it.skip("docx → markdown does not access Node Buffer/fs (activate in GST-8)", async () => {
    // TODO: import mammoth converter, convert a fixture, assert markdown output.
  });

  it.skip("pdf → markdown does not access Node Buffer/fs (activate in GST-9)", async () => {
    // TODO: import pdfjs converter, convert a fixture, assert markdown output.
  });

  it.skip("xlsx → markdown does not access Node Buffer/fs (activate in GST-10)", async () => {
    // TODO: import xlsx converter, convert a fixture, assert markdown output.
  });

  it.skip("zip/epub → markdown does not access Node Buffer/fs (activate in GST-11)", async () => {
    // TODO: import jszip converter, convert a fixture, assert markdown output.
  });
});
