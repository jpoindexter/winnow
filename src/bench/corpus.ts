// Fidelity corpus — realistic fat tool outputs, each with a "needle": a fact that a
// downstream model would need. The bench checks whether the needle survives compression
// inline (and notes that anything elided is still recoverable from the store). Position
// is tracked because head/tail needles survive crushing while deep-middle ones get
// elided — the honest tradeoff, made lossless by reversibility.

export type Position = "head" | "tail" | "middle" | "anywhere";
export interface BenchCase {
  id: string;
  kind: "json" | "logs" | "text";
  doc: string;
  needle: string;
  where: Position;
}

function rows(n: number, mk: (i: number) => Record<string, unknown>): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => mk(i));
}

const bigList = (needleAt: number, needleVal: string): string =>
  JSON.stringify(
    rows(60, (i) => (i === needleAt
      ? { id: i, name: needleVal, status: "active" }
      : { id: i, name: `item-${i}`, status: "active" })),
  );

const noisyLog = (needle: string): string =>
  [
    ...Array.from({ length: 200 }, () => "INFO  heartbeat ok — nominal, all systems green"),
    `ERROR  ${needle}`,
    ...Array.from({ length: 200 }, () => "INFO  heartbeat ok — nominal, all systems green"),
  ].join("\n");

export const CORPUS: BenchCase[] = [
  { id: "json-head", kind: "json", doc: bigList(1, "MegaCorp-Acquisition"), needle: "MegaCorp-Acquisition", where: "head" },
  { id: "json-tail", kind: "json", doc: bigList(59, "FinalRecord-Zulu"), needle: "FinalRecord-Zulu", where: "tail" },
  { id: "json-middle", kind: "json", doc: bigList(30, "BuriedDeal-Mid"), needle: "BuriedDeal-Mid", where: "middle" },
  { id: "log-error", kind: "logs", doc: noisyLog("disk full on /var/data"), needle: "disk full on /var/data", where: "anywhere" },
  { id: "log-dupes", kind: "logs", doc: ["build start", ...Array(300).fill("compiling module graphics/renderer/pipeline"), "FATAL: missing symbol foo_bar", "build end"].join("\n"), needle: "missing symbol foo_bar", where: "anywhere" },
  { id: "text-prose", kind: "text", doc: ["# Notes", "", "", "", "The deploy key is rotated quarterly.", "", "", "", "Owner: platform-team."].join("\n"), needle: "deploy key is rotated quarterly", where: "anywhere" },
];
