import { describe, it, expect } from "vitest";
import { dedupeBlocks, rehydrateBlocks, dedupeMessages } from "./dedup.js";

const BLOCK = "This is a sufficiently long repeated block of text that appears more than once.";

describe("dedupeBlocks / rehydrateBlocks", () => {
  it("replaces later duplicates with a reference and round-trips exactly", () => {
    const text = [BLOCK, "unique middle paragraph here, also long enough to matter", BLOCK].join("\n\n");
    const r = dedupeBlocks(text);
    expect(r.deduped).toBe(1);
    expect(r.text).toContain("⟦↺#0⟧");
    expect(rehydrateBlocks(r.text, r.refs)).toBe(text);
  });

  it("leaves short blocks untouched", () => {
    const text = ["hi", "hi", "hi"].join("\n\n");
    expect(dedupeBlocks(text).deduped).toBe(0);
  });

  it("shrinks heavily-repeated content", () => {
    const text = Array(10).fill(BLOCK).join("\n\n");
    const r = dedupeBlocks(text);
    expect(r.deduped).toBe(9);
    expect(r.text.length).toBeLessThan(text.length);
    expect(rehydrateBlocks(r.text, r.refs)).toBe(text);
  });
});

describe("dedupeMessages", () => {
  it("collapses a repeated message (e.g. a re-read file) to a reference", () => {
    const msgs = [
      { role: "tool", content: BLOCK },
      { role: "assistant", content: "ok, noted that long enough message content here" },
      { role: "tool", content: BLOCK },
    ];
    const r = dedupeMessages(msgs);
    expect(r.deduped).toBe(1);
    expect(r.messages[2]!.content).toBe("⟦↺#0⟧");
    expect(r.refs[0]).toBe(BLOCK);
  });
});
