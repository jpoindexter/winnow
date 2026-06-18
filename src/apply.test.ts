import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyCompression } from "./apply.js";
import { retrieve } from "./store.js";

describe("applyCompression (reversible)", () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "winnow-apply-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("compresses, footers the retrieval id, and stays reversible", async () => {
    const big = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `n${i}` })));
    const r = await applyCompression(big, { dir });
    expect(r.compressed).toBe(true);
    expect(r.originalId).toBeTruthy();
    expect(r.text).toContain("winnow:");
    expect(await retrieve(r.originalId!, dir)).toBe(big);
  });

  it("is a no-op for small input", async () => {
    const r = await applyCompression("tiny", { dir });
    expect(r.compressed).toBe(false);
    expect(r.text).toBe("tiny");
  });
});
