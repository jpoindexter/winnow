// Fidelity corpus — realistic fat tool outputs, each with a "needle": a fact that a
// downstream model would need. The bench checks whether the needle survives compression
// inline (and notes that anything elided is still recoverable from the store). Position
// is tracked because head/tail needles survive crushing while deep-middle ones get
// elided — the honest tradeoff, made lossless by reversibility.
function rows(n, mk) {
    return Array.from({ length: n }, (_, i) => mk(i));
}
const bigList = (needleAt, needleVal) => JSON.stringify(rows(60, (i) => (i === needleAt
    ? { id: i, name: needleVal, status: "active" }
    : { id: i, name: `item-${i}`, status: "active" })));
// A wide, short-field table (a SQL/API row dump) — TOON's sweet spot: many keys to
// dedupe, short values. Row 120 carries the needle.
const wideTable = (needle) => JSON.stringify(Array.from({ length: 200 }, (_, i) => ({
    id: i, user_id: 1000 + i, name: i === 120 ? needle : `user${i}`,
    email: `u${i}@example.com`, status: i % 2 ? "active" : "idle",
    role: i % 3 ? "member" : "admin", plan: "pro", region: "us-east-1",
    score: i % 100, tier: `T${i % 3}`, verified: i % 2 === 0, seq: i,
})));
const noisyLog = (needle) => [
    ...Array.from({ length: 200 }, () => "INFO  heartbeat ok — nominal, all systems green"),
    `ERROR  ${needle}`,
    ...Array.from({ length: 200 }, () => "INFO  heartbeat ok — nominal, all systems green"),
].join("\n");
export const CORPUS = [
    { id: "json-head", kind: "json", doc: bigList(1, "MegaCorp-Acquisition"), needle: "MegaCorp-Acquisition", where: "head" },
    { id: "json-tail", kind: "json", doc: bigList(59, "FinalRecord-Zulu"), needle: "FinalRecord-Zulu", where: "tail" },
    { id: "json-middle", kind: "json", doc: bigList(30, "BuriedDeal-Mid"), needle: "BuriedDeal-Mid", where: "middle" },
    { id: "wide-table", kind: "json", doc: wideTable("acct-vip-7741"), needle: "acct-vip-7741", where: "middle" },
    { id: "log-error", kind: "logs", doc: noisyLog("disk full on /var/data"), needle: "disk full on /var/data", where: "anywhere" },
    { id: "log-dupes", kind: "logs", doc: ["build start", ...Array(300).fill("compiling module graphics/renderer/pipeline"), "FATAL: missing symbol foo_bar", "build end"].join("\n"), needle: "missing symbol foo_bar", where: "anywhere" },
    { id: "text-prose", kind: "text", doc: ["# Notes", "", "", "", "The deploy key is rotated quarterly.", "", "", "", "Owner: platform-team."].join("\n"), needle: "deploy key is rotated quarterly", where: "anywhere" },
];
//# sourceMappingURL=corpus.js.map