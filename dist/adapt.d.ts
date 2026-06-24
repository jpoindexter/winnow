import { type BenchCase } from "./bench/corpus.js";
import type { CompressOptions } from "./types.js";
export interface TuneResult {
    options: CompressOptions;
    /** The ranking objective's value for the winner. */
    score: number;
    survival: number;
    ratio: number;
    /** Cost-Normalized Gain vs uncompressed (quality kept per token saved). */
    cng: number;
}
export type RankBy = "weighted" | "cng";
/** Default candidate grid: lossless TOON vs elision at a few head/tail budgets. */
export declare const DEFAULT_GRID: CompressOptions[];
/**
 * Choose the compression options that best preserve information per token saved on the
 * given cases. `survivalWeight` (default 0.7) favors fidelity over raw savings — raise it
 * toward 1 when correctness matters most, lower it when you're purely cost-cutting.
 */
export declare function tuneOptions(cases?: BenchCase[], grid?: CompressOptions[], survivalWeight?: number, rankBy?: RankBy): TuneResult;
