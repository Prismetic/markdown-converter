import { describe, test, expect } from 'vitest';
import { renderStats } from '../../src/popup/stats.js';
import type { ConversionStats } from '@tool/core';

function makeStats(
  fidelity: 'high' | 'degraded' | 'failed',
  warnings: string[] = [],
  durationMs = 100,
): ConversionStats {
  return { fidelity, warnings, durationMs, inputBytes: 1024, outputBytes: 512 };
}

describe('renderStats', () => {
  describe('fidelity states', () => {
    test('renders high fidelity', () => {
      const out = renderStats(makeStats('high'));
      expect(out).toContain('high');
      expect(out).not.toContain('failed');
      expect(out).not.toContain('degraded');
    });

    test('renders degraded fidelity', () => {
      const out = renderStats(makeStats('degraded'));
      expect(out).toContain('degraded');
      expect(out).not.toContain('failed');
      expect(out).not.toContain('high');
    });

    test('renders failed fidelity', () => {
      const out = renderStats(makeStats('failed'));
      expect(out).toContain('failed');
    });
  });

  describe('warning count', () => {
    test('shows 0 warnings', () => {
      const out = renderStats(makeStats('high', []));
      expect(out).toContain('0 warnings');
    });

    test('shows 1 warning (singular)', () => {
      const out = renderStats(makeStats('high', ['minor table issue']));
      expect(out).toContain('1 warning');
      expect(out).not.toContain('1 warnings');
    });

    test('shows 3 warnings (plural)', () => {
      const out = renderStats(makeStats('degraded', ['a', 'b', 'c']));
      expect(out).toContain('3 warnings');
    });
  });

  describe('duration', () => {
    test('shows duration in ms', () => {
      const out = renderStats(makeStats('high', [], 42));
      expect(out).toContain('42ms');
    });

    test('shows zero duration', () => {
      const out = renderStats(makeStats('high', [], 0));
      expect(out).toContain('0ms');
    });
  });
});
