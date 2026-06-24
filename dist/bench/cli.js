import { runFidelity, formatFidelity } from "./fidelity.js";
import { CORPUS } from "./corpus.js";
// `winnow bench` — default (elision) fidelity, then the lossless TOON mode on the
// object-array cases, where the deep-middle needle that elision drops now survives.
console.log(formatFidelity(runFidelity()));
const toon = runFidelity(CORPUS.filter((c) => c.kind === "json"), { tabular: true });
const pct = (x) => `${(x * 100).toFixed(0)}%`;
console.log("\n— TOON (lossless tabular) on object-array cases —");
for (const c of toon.cases) {
    console.log(`  ${c.id.padEnd(12)} save ${pct(c.ratio).padStart(4)}  inline ${c.inlineSurvived ? "✓" : "·"}`);
}
console.log(`  every row kept; deep-middle needle now survives inline: ${toon.cases.find((c) => c.id === "json-middle")?.inlineSurvived}`);
const dict = runFidelity(CORPUS.filter((c) => c.kind === "json"), { tabular: true, dictionary: true });
console.log("\n— TOON + dictionary (columnar, lossless) on object-array cases —");
for (const c of dict.cases) {
    console.log(`  ${c.id.padEnd(12)} save ${pct(c.ratio).padStart(4)}  inline ${c.inlineSurvived ? "✓" : "·"}`);
}
//# sourceMappingURL=cli.js.map