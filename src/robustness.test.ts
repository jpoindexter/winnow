import { describe, it, expect } from "vitest";
import { compressText } from "./router.js";
import { crushJson } from "./json-crush.js";
import { squashLogs } from "./log-squash.js";
import { compressCode } from "./code.js";
import { alignSegments } from "./cache.js";
import { offload } from "./offload.js";
import { stats } from "./index.js";

// Edge cases — compression must never throw and must degrade safely. These guard the
// "best-effort, never break the caller" contract across odd inputs.

describe("never throws on degenerate input", () => {
  it("handles empty / tiny strings", () => {
    expect(compressText("").compressed).toBe(false);
    expect(squashLogs("")).toBe("");
    expect(crushJson("")).toBe("");
    expect(stats("", "")).toEqual({ tokensBefore: 0, tokensAfter: 0, tokensSaved: 0, ratio: 0 });
  });

  it("passes non-object-array JSON through structurally", () => {
    const out = crushJson(JSON.stringify([1, 2, 3, 4, 5]));
    expect(JSON.parse(out)).toEqual([1, 2, 3, 4, 5]);
  });

  it("survives JSON nested far beyond the depth bound", () => {
    let deep: unknown = "leaf";
    for (let i = 0; i < 50; i++) deep = { nest: deep };
    expect(() => crushJson(JSON.stringify(deep))).not.toThrow();
  });

  it("treats bracket-leading but invalid JSON as text, no throw", () => {
    const r = compressText("[ not really json ".repeat(200));
    expect(r.contentType).toBe("text");
  });

  it("handles unicode and control chars without crashing", () => {
    expect(() => compressText("héllo 🌍  \t\n".repeat(500))).not.toThrow();
  });
});

describe("compressCode is safe on non-strippable / broken input", () => {
  it("returns null when there are no bodies to strip", async () => {
    expect(await compressCode("export const x = 1;")).toBeNull();
  });
  it("does not throw on syntactically rough source", async () => {
    await expect(compressCode("function f( { return")).resolves.toBeDefined();
  });
});

describe("alignSegments edge shapes", () => {
  it("handles all-stable, all-volatile, and empty", () => {
    expect(alignSegments([]).cacheKey).toBeTruthy();
    expect(alignSegments([{ id: "a", text: "A", stable: true }]).movedVolatile).toEqual([]);
    expect(alignSegments([{ id: "v", text: "V", stable: false }]).breakpoint).toBe(0);
  });
});

describe("offload boundary", () => {
  it("does not offload text exactly at the limit", async () => {
    const at = "x".repeat(100);
    const r = await offload(at, { maxChars: 100 });
    expect(r.offloaded).toBe(false);
  });
});
