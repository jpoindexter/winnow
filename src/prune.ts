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
export function pruneText(text: string, opts: PruneOptions = {}): PruneResult {
  const keepRatio = Math.min(1, Math.max(0, opts.keepRatio ?? DEFAULT_KEEP));
  const protect = opts.protect ?? DEFAULT_PROTECT;
  const tokens = text.split(/(\s+)/); // keep whitespace tokens to rebuild spacing
  const words = tokens.filter((t) => t.trim().length > 0);
  if (words.length === 0) return { text, keptRatio: 1 };

  const scores = (opts.score ?? proxyScore)(words);
  const forced = new Set<number>();
  words.forEach((w, i) => { if (protect.test(w)) forced.add(i); });
  const budget = Math.max(forced.size, Math.round(words.length * keepRatio));
  const ranked = words.map((_, i) => i).filter((i) => !forced.has(i)).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const keep = new Set<number>([...forced, ...ranked.slice(0, Math.max(0, budget - forced.size))]);

  let wi = -1;
  const out = tokens.map((t) => {
    if (t.trim().length === 0) return t; // whitespace passes through
    wi++;
    return keep.has(wi) ? t : "";
  }).join("").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text: out, keptRatio: keep.size / words.length };
}
