// Token pruning (LLMLingua-style). The mechanism: score each token by how much
// information it carries, then drop the lowest-scoring ones down to a target ratio.
// The SCORER is injected — give it perplexity/self-information from your own small LM
// for LLMLingua-grade pruning. The built-in fallback is a model-free self-information
// PROXY (rare/long tokens kept, common stopwords dropped); it's a heuristic, not a model,
// so it's lossy on prose — opt-in only, never in the default pipeline. Pure.

export type TokenScorer = (tokens: string[]) => number[];

export interface PruneOptions {
  /** Fraction of tokens to keep, 0..1. Default 0.5. */
  keepRatio?: number;
  /** Injected informativeness scorer (higher = keep). Omit for the heuristic proxy. */
  score?: TokenScorer;
  /** Tokens matching this are always kept (e.g. numbers, identifiers). */
  protect?: RegExp;
}

const STOPWORDS = new Set(
  "the a an of to in on at for and or but is are was were be been being this that these those with as by from it its".split(" "),
);
const DEFAULT_KEEP = 0.5;
const DEFAULT_PROTECT = /[0-9]|[{}()[\]<>=]/; // numbers + code-ish punctuation

/** Model-free self-information proxy: rarer + longer tokens score higher; stopwords low. */
function proxyScore(tokens: string[]): number[] {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t.toLowerCase(), (freq.get(t.toLowerCase()) ?? 0) + 1);
  const n = tokens.length || 1;
  return tokens.map((t) => {
    const lc = t.toLowerCase();
    if (STOPWORDS.has(lc)) return 0;
    const rarity = Math.log(n / (freq.get(lc) ?? 1)); // self-information ~ -log(p)
    return rarity + Math.min(t.length, 12) / 12;
  });
}

export interface PruneResult {
  text: string;
  keptRatio: number;
}

/**
 * Prune low-information tokens to `keepRatio`, preserving order. Protected tokens are
 * always kept and don't count against the budget. Pure given the (optional) scorer.
 */
function splitWords(text: string): { tokens: string[]; words: string[] } {
  const tokens = text.split(/(\s+)/); // keep whitespace tokens to rebuild spacing
  return { tokens, words: tokens.filter((t) => t.trim().length > 0) };
}

/** Assemble pruned text from precomputed informativeness scores (higher = keep). Pure. */
function assemble(tokens: string[], words: string[], scores: number[], keepRatio: number, protect: RegExp): PruneResult {
  const forced = new Set<number>();
  words.forEach((w, i) => { if (protect.test(w)) forced.add(i); });
  const budget = Math.max(forced.size, Math.round(words.length * keepRatio));
  const ranked = words.map((_, i) => i).filter((i) => !forced.has(i)).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const keep = new Set<number>([...forced, ...ranked.slice(0, Math.max(0, budget - forced.size))]);
  let wi = -1;
  const out = tokens.map((t) => {
    if (t.trim().length === 0) return t;
    wi++;
    return keep.has(wi) ? t : "";
  }).join("").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text: out, keptRatio: keep.size / words.length };
}

export function pruneText(text: string, opts: PruneOptions = {}): PruneResult {
  const keepRatio = Math.min(1, Math.max(0, opts.keepRatio ?? DEFAULT_KEEP));
  const { tokens, words } = splitWords(text);
  if (words.length === 0) return { text, keptRatio: 1 };
  return assemble(tokens, words, (opts.score ?? proxyScore)(words), keepRatio, opts.protect ?? DEFAULT_PROTECT);
}

/** Async informativeness scorer — e.g. an LM's per-token surprisal. Higher = keep. */
export type AsyncTokenScorer = (tokens: string[]) => Promise<number[]>;

export interface AsyncPruneOptions {
  keepRatio?: number;
  score: AsyncTokenScorer;
  protect?: RegExp;
}

/** Like pruneText but with an async scorer — wire an LM here for LLMLingua-grade pruning
 * (the heuristic proxy stays the zero-dep default via pruneText). */
export async function pruneTextAsync(text: string, opts: AsyncPruneOptions): Promise<PruneResult> {
  const keepRatio = Math.min(1, Math.max(0, opts.keepRatio ?? DEFAULT_KEEP));
  const { tokens, words } = splitWords(text);
  if (words.length === 0) return { text, keptRatio: 1 };
  return assemble(tokens, words, await opts.score(words), keepRatio, opts.protect ?? DEFAULT_PROTECT);
}

/** Per-token logprob function (values ≤ 0), e.g. from an LM with logprobs enabled. */
export type LogprobFn = (tokens: string[]) => Promise<number[]>;

/** Adapt an LM logprob fn into a keep-scorer: surprisal = -logprob, so information-dense
 * (surprising) tokens are kept and predictable filler is dropped — the LLMLingua principle
 * with your own model. */
export function makeLmScorer(logprob: LogprobFn): AsyncTokenScorer {
  return async (tokens) => (await logprob(tokens)).map((lp) => -lp);
}
