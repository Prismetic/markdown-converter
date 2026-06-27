import type { ConversionStats } from '../shared/messages.js';

export function renderStats(stats: ConversionStats): string {
  const w = stats.warnings.length;
  return `Fidelity: ${stats.fidelity} | ${w} warning${w !== 1 ? 's' : ''} | ${stats.durationMs}ms`;
}
