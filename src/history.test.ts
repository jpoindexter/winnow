import { describe, it, expect } from "vitest";
import { compactHistory, type Msg } from "./history.js";

const turns = (n: number): Msg[] =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `Message number ${i}. Some detail follows here.` }));

describe("compactHistory", () => {
  it("returns the array unchanged when within keepRecent", async () => {
    const m = turns(4);
    expect(await compactHistory(m, { keepRecent: 6 })).toEqual(m);
  });

  it("folds older turns into one leading summary, keeps recent verbatim", async () => {
    const m = turns(10);
    const out = await compactHistory(m, { keepRecent: 3 });
    expect(out).toHaveLength(4); // 1 summary + 3 recent
    expect(out[0]!.role).toBe("system");
    expect(out[0]!.content).toContain("Earlier conversation (compacted)");
    expect(out.slice(1)).toEqual(m.slice(7)); // last 3 untouched
  });

  it("uses an injected summarizer when provided", async () => {
    const m = turns(10);
    const out = await compactHistory(m, { keepRecent: 2, summarize: () => "ONE LINE SUMMARY" });
    expect(out[0]!.content).toContain("ONE LINE SUMMARY");
  });

  it("falls back to extractive summary if the summarizer throws", async () => {
    const m = turns(8);
    const out = await compactHistory(m, { keepRecent: 2, summarize: () => { throw new Error("llm down"); } });
    expect(out[0]!.content).toContain("Earlier conversation (compacted)");
  });

  it("merges into a prior anchored summary", async () => {
    const m = turns(8);
    const out = await compactHistory(m, { keepRecent: 2, priorSummary: "PRIOR-ANCHOR" });
    expect(out[0]!.content).toContain("PRIOR-ANCHOR");
  });
});
