export type TokenScorer = (tokens: string[]) => number[];
export interface PruneOptions {
    /** Fraction of tokens to keep, 0..1. Default 0.5. */
    keepRatio?: number;
    /** Injected informativeness scorer (higher = keep). Omit for the heuristic proxy. */
    score?: TokenScorer;
    /** Tokens matching this are always kept (e.g. numbers, identifiers). */
    protect?: RegExp;
}
export interface PruneResult {
    text: string;
    keptRatio: number;
}
export declare function pruneText(text: string, opts?: PruneOptions): PruneResult;
/** Async informativeness scorer — e.g. an LM's per-token surprisal. Higher = keep. */
export type AsyncTokenScorer = (tokens: string[]) => Promise<number[]>;
export interface AsyncPruneOptions {
    keepRatio?: number;
    score: AsyncTokenScorer;
    protect?: RegExp;
}
/** Like pruneText but with an async scorer — wire an LM here for LLMLingua-grade pruning
 * (the heuristic proxy stays the zero-dep default via pruneText). */
export declare function pruneTextAsync(text: string, opts: AsyncPruneOptions): Promise<PruneResult>;
/** Per-token logprob function (values ≤ 0), e.g. from an LM with logprobs enabled. */
export type LogprobFn = (tokens: string[]) => Promise<number[]>;
/** Adapt an LM logprob fn into a keep-scorer: surprisal = -logprob, so information-dense
 * (surprising) tokens are kept and predictable filler is dropped — the LLMLingua principle
 * with your own model. */
export declare function makeLmScorer(logprob: LogprobFn): AsyncTokenScorer;
