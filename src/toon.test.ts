import { describe, it, expect } from "vitest";
import { encodeTable, decodeTable, toonCompress, isObjectArray } from "./toon.js";
import { estTokens } from "./types.js";

describe("encodeTable / decodeTable round-trip (lossless)", () => {
  it("preserves types, nesting, null vs missing, and special chars", () => {
    const rows = [
      { id: 1, name: "a", active: true, tags: ["x", "y"], note: null },
      { id: 2, name: 'has, comma "and quote"', active: false, meta: { nested: 1 } },
      { id: 3, name: "missing-fields" }, // active/tags absent
    ];
    const table = encodeTable(rows)!;
    expect(table.startsWith("TOON 3")).toBe(true);
    const back = decodeTable(table);
    expect(back).toEqual(rows); // exact round-trip including absent keys
  });

  it("keeps EVERY row (no elision) and still shrinks a uniform array", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}`, status: "active" }));
    const json = JSON.stringify(rows);
    const table = encodeTable(rows)!;
    expect(decodeTable(table)).toHaveLength(100); // lossless — all rows survive
    expect(estTokens(table)).toBeLessThan(estTokens(json));
  });
});

describe("isObjectArray", () => {
  it("accepts arrays of plain objects, rejects others", () => {
    expect(isObjectArray([{ a: 1 }])).toBe(true);
    expect(isObjectArray([1, 2, 3])).toBe(false);
    expect(isObjectArray([])).toBe(false);
    expect(isObjectArray([[1], [2]])).toBe(false);
  });
});

describe("toonCompress", () => {
  it("transcodes an object-array JSON string, losslessly", () => {
    const json = JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ id: i, v: `v${i}` })));
    const out = toonCompress(json)!;
    expect(out).toBeTruthy();
    expect(decodeTable(out)).toEqual(JSON.parse(json));
  });

  it("returns null for non-object-array or non-shrinking input", () => {
    expect(toonCompress("{not json")).toBeNull();
    expect(toonCompress(JSON.stringify({ a: 1 }))).toBeNull();
    expect(toonCompress(JSON.stringify([1, 2, 3]))).toBeNull();
  });
});
