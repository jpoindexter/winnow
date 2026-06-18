import { describe, it, expect } from "vitest";
import { alignSegments, cacheHolds, type Segment } from "./cache.js";

const seg = (id: string, text: string, stable: boolean): Segment => ({ id, text, stable });

describe("alignSegments", () => {
  it("moves volatile segments after stable ones and flags the churn", () => {
    const a = alignSegments([
      seg("clock", "time: 10:00", false), // volatile, sitting first → busts the cache
      seg("system", "you are an agent", true),
      seg("tools", "tool catalog", true),
    ]);
    expect(a.prompt.indexOf("you are an agent")).toBeLessThan(a.prompt.indexOf("time: 10:00"));
    expect(a.movedVolatile).toContain("clock");
  });

  it("keeps the stable-prefix key constant when only volatile text changes", () => {
    const stable = [seg("system", "S", true), seg("tools", "T", true)];
    const k1 = alignSegments([...stable, seg("clock", "10:00", false)]).cacheKey;
    const k2 = alignSegments([...stable, seg("clock", "11:00", false)]).cacheKey;
    expect(k1).toBe(k2); // volatile change does NOT invalidate the cached prefix
  });

  it("changes the key when stable text changes", () => {
    const k1 = alignSegments([seg("system", "S1", true)]).cacheKey;
    const k2 = alignSegments([seg("system", "S2", true)]).cacheKey;
    expect(k1).not.toBe(k2);
  });
});

describe("cacheHolds", () => {
  it("is true only when the prior key matches the current stable prefix", () => {
    const a = alignSegments([seg("system", "S", true)]);
    expect(cacheHolds(a.cacheKey, a)).toBe(true);
    expect(cacheHolds("different", a)).toBe(false);
    expect(cacheHolds(undefined, a)).toBe(false);
  });
});
