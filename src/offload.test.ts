import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { offload } from "./offload.js";
import { retrieve } from "./store.js";

describe("offload", () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "winnow-off-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("passes under-limit text through unchanged", async () => {
    const r = await offload("small", { dir, maxChars: 1000 });
    expect(r.offloaded).toBe(false);
    expect(r.output).toBe("small");
  });

  it("strong backbone → file pointer with a retrievable path", async () => {
    const big = "first line\n" + "x".repeat(60_000);
    const r = await offload(big, { dir, modelId: "gpt-4o" });
    expect(r.delivery).toBe("file");
    expect(r.output).toContain(".winnow/ccr/");
    expect(r.output).toContain("summary: first line");
    const id = /id="([a-f0-9]+)"/.exec(r.output)?.[1];
    expect(await retrieve(id!, dir)).toBe(big);
  });

  it("weak backbone → larger inline window, never a file-only pointer", async () => {
    const big = "y".repeat(60_000);
    const r = await offload(big, { dir, modelId: "gpt-4o-mini" });
    expect(r.delivery).toBe("inline");
    expect(r.output).toContain("fit a smaller model");
    expect(r.output).not.toContain("winnow_retrieve");
    expect(r.output.startsWith("y".repeat(8_000))).toBe(true);
  });
});
