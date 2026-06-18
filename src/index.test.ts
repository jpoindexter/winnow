import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compress, stats, compressMessages } from "./index.js";

describe("public API", () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "winnow-idx-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("compress is the reversible compressor", async () => {
    const big = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-number-${i}`, status: "active" })));
    const r = await compress(big, { dir });
    expect(r.compressed).toBe(true);
  });

  it("stats reports token savings and ratio", () => {
    const s = stats("x".repeat(4000), "x".repeat(400));
    expect(s.tokensSaved).toBe(s.tokensBefore - s.tokensAfter);
    expect(s.ratio).toBeCloseTo(0.9, 1);
  });

  it("compressMessages compresses each message's content", async () => {
    const big = JSON.stringify(Array.from({ length: 80 }, (_, i) => ({ id: i, v: `value-${i}` })));
    const out = await compressMessages([{ role: "tool", content: big }, { role: "user", content: "hi" }], { dir });
    expect(out[0]!.content.length).toBeLessThan(big.length);
    expect(out[1]!.content).toBe("hi");
  });
});
