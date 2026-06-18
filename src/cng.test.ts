import { describe, it, expect } from "vitest";
import { costNormalizedGain, compressionCng } from "./cng.js";

describe("costNormalizedGain", () => {
  it("is quality gain divided by relative cost change", () => {
    // +0.1 quality for a 20% cost change → 0.1 / 0.2 = 0.5
    expect(costNormalizedGain(0.5, 0.6, 20)).toBeCloseTo(0.5, 6);
    expect(costNormalizedGain(0.5, 0.6, -20)).toBeCloseTo(0.5, 6); // sign of cost ignored
  });

  it("penalizes quality lost per token saved", () => {
    expect(costNormalizedGain(1.0, 0.8, -50)).toBeLessThan(0); // lost quality → negative
  });

  it("returns the raw gain when there is no cost change", () => {
    expect(costNormalizedGain(0.5, 0.7, 0)).toBeCloseTo(0.2, 6);
  });
});

describe("compressionCng", () => {
  it("is 0 for lossless compression (no quality loss), regardless of savings", () => {
    expect(compressionCng(1, 0.74)).toBe(0); // survival 1.0 → no gain, no loss
  });
  it("is negative when compression drops quality", () => {
    expect(compressionCng(0.5, 0.6)).toBeLessThan(0);
  });
});
