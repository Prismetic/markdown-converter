import type { ConversionStats } from '@tool/core';

export function renderStats(stats: ConversionStats): string {
  const w = stats.warnings.length;
  return `Fidelity: ${stats.fidelity} | ${w} warning${w !== 1 ? 's' : ''} | ${stats.durationMs}ms`;
}
