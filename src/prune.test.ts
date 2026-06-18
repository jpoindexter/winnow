import { describe, it, expect } from "vitest";
import { pruneText, pruneTextAsync, makeLmScorer } from "./prune.js";

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

describe("pruneTextAsync (LM backend)", () => {
  it("prunes with an async scorer", async () => {
    const text = "the cat sat on the mat and looked around the room slowly";
    const score = (toks: string[]) => Promise.resolve(toks.map((t) => t.length)); // longer = keep
    const r = await pruneTextAsync(text, { keepRatio: 0.5, score });
    expect(r.text.length).toBeLessThan(text.length);
  });

  it("makeLmScorer turns logprobs into a keep-scorer (surprisal = -logprob)", async () => {
    // 'quantum' has the lowest logprob (most surprising) → must survive an aggressive prune
    const words = "the system uses quantum entanglement here".split(" ");
    const logprob = (toks: string[]) => Promise.resolve(toks.map((t) => (t === "quantum" ? -9 : -0.2)));
    const r = await pruneTextAsync("the system uses quantum entanglement here", { keepRatio: 0.3, score: makeLmScorer(logprob) });
    expect(r.text).toContain("quantum");
  });

  it("the injected scorer fully controls what survives an aggressive prune", async () => {
    // only the LM-scored 'keep' token survives at keepRatio 0.2; default-protected
    // numbers/code aside, the model's scores drive selection.
    const text = "discard discard keepme discard discard discard";
    const lm = await pruneTextAsync(text, { keepRatio: 0.2, score: makeLmScorer((t) => Promise.resolve(t.map((w) => (w === "keepme" ? -10 : -0.1)))) });
    expect(lm.text).toContain("keepme");
  });
});
