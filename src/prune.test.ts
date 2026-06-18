import { describe, it, expect } from "vitest";
import { pruneText } from "./prune.js";

describe("pruneText", () => {
  it("drops toward the keep ratio and shrinks the text", () => {
    const text = "the quick brown fox jumps over the lazy dog and then the fox runs away quickly".repeat(3);
    const r = pruneText(text, { keepRatio: 0.5 });
    expect(r.keptRatio).toBeLessThanOrEqual(0.75);
    expect(r.text.length).toBeLessThan(text.length);
  });

  it("always keeps protected tokens (numbers/code by default)", () => {
    const text = "the server responded with status 42 and error code 0xBEEF on the endpoint";
    const r = pruneText(text, { keepRatio: 0.3 });
    expect(r.text).toContain("42");
  });

  it("honors an injected scorer (LLMLingua-style: bring your own model)", () => {
    const text = "alpha beta gamma delta";
    // score only "gamma" as informative → it must survive an aggressive prune
    const score = (toks: string[]) => toks.map((t) => (t === "gamma" ? 100 : 0));
    const r = pruneText(text, { keepRatio: 0.25, score });
    expect(r.text).toContain("gamma");
  });

  it("is a no-op on empty / whitespace input", () => {
    expect(pruneText("   ").keptRatio).toBe(1);
  });
});
