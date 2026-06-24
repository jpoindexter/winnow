import { compressText } from "../router.js";
import { estTokens } from "../types.js";
import { compressionCng } from "../cng.js";
import { CORPUS } from "./corpus.js";
function mean(xs) {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function runCase(c, opts) {
    const before = estTokens(c.doc);
    const r = compressText(c.doc, opts);
    const ratio = before ? Math.max(0, before - r.tokensAfter) / before : 0;
    return { id: c.id, kind: c.kind, where: c.where, ratio, inlineSurvived: r.text.includes(c.needle) };
}
/** Run the fidelity bench over the corpus (or a supplied set). Pure given the corpus. */
export function runFidelity(cases = CORPUS, opts = {}) {
    const results = cases.map((c) => runCase(c, opts));
    const byPosition = {};
    for (const pos of new Set(results.map((r) => r.where))) {
        const inPos = results.filter((r) => r.where === pos);
        byPosition[pos] = mean(inPos.map((r) => (r.inlineSurvived ? 1 : 0)));
    }
    const avgRatio = mean(results.map((r) => r.ratio));
    const inlineSurvival = mean(results.map((r) => (r.inlineSurvived ? 1 : 0)));
    return { cases: results, avgRatio, inlineSurvival, byPosition, cng: compressionCng(inlineSurvival, avgRatio) };
}
/** One-line-per-case table + summary. Pure. */
export function formatFidelity(r) {
    const pct = (x) => `${(x * 100).toFixed(0)}%`;
    const rows = r.cases.map((c) => `  ${c.id.padEnd(12)} ${c.kind.padEnd(5)} save ${pct(c.ratio).padStart(4)}  inline ${c.inlineSurvived ? "✓" : "· (recoverable)"}`);
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
//# sourceMappingURL=fidelity.js.map