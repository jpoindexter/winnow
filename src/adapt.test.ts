import { describe, it, expect } from "vitest";
import { tuneOptions, DEFAULT_GRID } from "./adapt.js";
import type { BenchCase } from "./bench/corpus.js";

const jsonCases: BenchCase[] = [
  { id: "a", kind: "json", doc: JSON.stringify(Array.from({ length: 120 }, (_, i) => ({ id: i, name: `item-number-${i}`, status: "active" }))), needle: "item-number-60", where: "middle" },
];

describe("tuneOptions", () => {
  it("returns a winning option set with its measured survival + ratio", () => {
    const r = tuneOptions();
    expect(DEFAULT_GRID).toContainEqual(r.options);
    expect(r.score).toBeGreaterThan(0);
    expect(r.survival).toBeGreaterThanOrEqual(0);
    expect(r.ratio).toBeGreaterThanOrEqual(0);
  });

  it("favors lossless TOON when survival is weighted high (middle needle would elide)", () => {
    const r = tuneOptions(jsonCases, DEFAULT_GRID, 1); // pure survival
    expect(r.options.tabular).toBe(true); // only the lossless option keeps the middle needle
    expect(r.survival).toBe(1);
  });

  it("can favor savings when survival weight is low", () => {
    const r = tuneOptions(jsonCases, DEFAULT_GRID, 0); // pure savings
    expect(r.ratio).toBeGreaterThan(0);
  });
});
