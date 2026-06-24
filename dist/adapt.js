import { runFidelity } from "./bench/fidelity.js";
import { CORPUS } from "./bench/corpus.js";
import { compressionCng } from "./cng.js";
/** Default candidate grid: lossless TOON vs elision at a few head/tail budgets. */
export const DEFAULT_GRID = [
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
export function tuneOptions(cases = CORPUS, grid = DEFAULT_GRID, survivalWeight = 0.7, rankBy = "weighted") {
    const w = Math.min(1, Math.max(0, survivalWeight));
    let best = null;
    for (const options of grid) {
        const r = runFidelity(cases, options);
        const cng = compressionCng(r.inlineSurvival, r.avgRatio);
        // CNG ranking: prefer least quality lost per token saved, tiebreak by savings.
        const key = rankBy === "cng" ? cng + r.avgRatio * 1e-6 : r.inlineSurvival * w + r.avgRatio * (1 - w);
        if (!best || key > best.key)
            best = { options, score: key, survival: r.inlineSurvival, ratio: r.avgRatio, cng, key };
    }
    if (!best)
        return { options: {}, score: 0, survival: 0, ratio: 0, cng: 0 };
    const { key: _key, ...result } = best;
    return result;
}
//# sourceMappingURL=adapt.js.map