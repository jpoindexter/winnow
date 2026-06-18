import { describe, it, expect } from "vitest";
import { makeCounter, heuristicCount, countTokens } from "./tokens.js";

describe("token counting", () => {
  it("heuristic is length/4", () => {
    expect(heuristicCount("12345678")).toBe(2);
    expect(countTokens("12345678")).toBe(2);
  });

  it("uses an injected encoder for exact counts", () => {
    const encode = (t: string) => t.split(" "); // word tokens
    const count = makeCounter(encode);
    expect(count("one two three")).toBe(3);
  });

  it("falls back to the heuristic if the encoder throws", () => {
    const count = makeCounter(() => { throw new Error("bad encoder"); });
    expect(count("12345678")).toBe(2);
  });
});
