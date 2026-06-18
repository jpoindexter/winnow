import { describe, it, expect } from "vitest";
import { crushJson } from "./json-crush.js";

describe("crushJson", () => {
  it("keeps head+tail and elides the middle of an object array", () => {
    const arr = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const out = JSON.parse(crushJson(JSON.stringify(arr), { headItems: 3, tailItems: 1 }));
    expect(out).toHaveLength(5); // 3 head + elision marker + 1 tail
    expect(out[3].__elided__).toBe(16);
    expect(out[0].id).toBe(0);
    expect(out[4].id).toBe(19);
  });

  it("records the union of keys across elided rows", () => {
    const arr = [
      ...Array.from({ length: 4 }, (_, i) => ({ a: i })),
      { a: 1, b: 2 },
      ...Array.from({ length: 4 }, (_, i) => ({ a: i })),
    ];
    const out = JSON.parse(crushJson(JSON.stringify(arr), { headItems: 1, tailItems: 1 }));
    expect(out[1].sample_keys).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("truncates long string values", () => {
    const out = crushJson(JSON.stringify({ x: "y".repeat(500) }), { maxStringLength: 50 });
    expect(out).toContain("+450 chars");
  });

  it("returns the original unchanged for invalid json", () => {
    expect(crushJson("{not json")).toBe("{not json");
  });
});
