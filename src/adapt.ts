import { runFidelity } from "./bench/fidelity.js";
import { CORPUS, type BenchCase } from "./bench/corpus.js";
import type { CompressOptions } from "./types.js";

// Adaptive compression (ACON-style). Compression has a knob — aggressive elision saves
// more tokens but drops more facts. Rather than guess, MEASURE: run each candidate option
// set through the fidelity bench and pick the one that maximizes a weighted blend of
// needle-survival and token-savings. Feed it your OWN traces (cases) and it tunes to your
// workload. Pure given the corpus.

export interface TuneResult {
  options: CompressOptions;
  /** Weighted objective, 0..1. */
  score: number;
  survival: number;
  ratio: number;
}

/** Default candidate grid: lossless TOON vs elision at a few head/tail budgets. */
export const DEFAULT_GRID: CompressOptions[] = [
  { tabular: true },
  { tabular: false, headItems: 1, tailItems: 1 },
  { tabular: false, headItems: 3, tailItems: 1 },
  { tabular: false, headItems: 8, tailItems: 2 },
];

/**
 * Choose the compression options that best preserve information per token saved on the
 * given cases. `survivalWeight` (default 0.7) favors fidelity over raw savings — raise it
 * toward 1 when correctness matters most, lower it when you're purely cost-cutting.
 */
export function tuneOptions(
  cases: BenchCase[] = CORPUS,
  grid: CompressOptions[] = DEFAULT_GRID,
  survivalWeight = 0.7,
): TuneResult {
  const w = Math.min(1, Math.max(0, survivalWeight));
  let best: TuneResult | null = null;
  for (const options of grid) {
    const r = runFidelity(cases, options);
    const score = r.inlineSurvival * w + r.avgRatio * (1 - w);
    if (!best || score > best.score) {
      best = { options, score, survival: r.inlineSurvival, ratio: r.avgRatio };
    }
  }
  // grid is non-empty, so best is set; fall back defensively.
  return best ?? { options: {}, score: 0, survival: 0, ratio: 0 };
}
