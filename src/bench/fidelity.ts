import { compressText } from "../router.js";
import { estTokens, type CompressOptions } from "../types.js";
import { compressionCng } from "../cng.js";
import { CORPUS, type BenchCase, type Position } from "./corpus.js";

// Fidelity bench — measured, not claimed. For each case: compress, record the token
// savings, and check whether the needle SURVIVES inline. Reversibility makes any elided
// needle recoverable from the store, so recoverable fidelity is 100% by construction;
// this measures the harder number — what survives WITHOUT a retrieval round-trip.

export interface CaseResult {
  id: string;
  kind: BenchCase["kind"];
  where: Position;
  ratio: number; // fraction of tokens removed
  inlineSurvived: boolean;
}

export interface FidelityReport {
  cases: CaseResult[];
  /** Mean fraction of tokens removed across the corpus, 0..1. */
  avgRatio: number;
  /** Fraction of needles that survived inline (no retrieval needed), 0..1. */
  inlineSurvival: number;
  /** Inline survival split by needle position. */
  byPosition: Partial<Record<Position, number>>;
  /** Cost-Normalized Gain vs uncompressed: quality kept per token saved (0 = lossless). */
  cng: number;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function runCase(c: BenchCase, opts: CompressOptions): CaseResult {
  const before = estTokens(c.doc);
  const r = compressText(c.doc, opts);
  const ratio = before ? Math.max(0, before - r.tokensAfter) / before : 0;
  return { id: c.id, kind: c.kind, where: c.where, ratio, inlineSurvived: r.text.includes(c.needle) };
}

/** Run the fidelity bench over the corpus (or a supplied set). Pure given the corpus. */
export function runFidelity(cases: BenchCase[] = CORPUS, opts: CompressOptions = {}): FidelityReport {
  const results = cases.map((c) => runCase(c, opts));
  const byPosition: Partial<Record<Position, number>> = {};
  for (const pos of new Set(results.map((r) => r.where))) {
    const inPos = results.filter((r) => r.where === pos);
    byPosition[pos] = mean(inPos.map((r) => (r.inlineSurvived ? 1 : 0)));
  }
  const avgRatio = mean(results.map((r) => r.ratio));
  const inlineSurvival = mean(results.map((r) => (r.inlineSurvived ? 1 : 0)));
  return { cases: results, avgRatio, inlineSurvival, byPosition, cng: compressionCng(inlineSurvival, avgRatio) };
}

/** One-line-per-case table + summary. Pure. */
export function formatFidelity(r: FidelityReport): string {
  const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
  const rows = r.cases.map(
    (c) => `  ${c.id.padEnd(12)} ${c.kind.padEnd(5)} save ${pct(c.ratio).padStart(4)}  inline ${c.inlineSurvived ? "✓" : "· (recoverable)"}`,
  );
  const byPos = Object.entries(r.byPosition).map(([p, v]) => `${p} ${pct(v ?? 0)}`).join(" · ");
  return [
    `winnow fidelity — ${r.cases.length} cases`,
    ...rows,
    "",
    `avg savings: ${pct(r.avgRatio)}   inline needle survival: ${pct(r.inlineSurvival)}   CNG: ${r.cng.toFixed(3)}`,
    `by position: ${byPos}`,
    `recoverable fidelity: 100% (every elided original is retrievable from the store)`,
  ].join("\n");
}
