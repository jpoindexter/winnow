import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentId, stashOriginal, retrieve, resolveStoreDir } from "./store.js";

describe("store (reversible CCR)", () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "winnow-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("round-trips text through stash → retrieve", async () => {
    const text = "the full original output ".repeat(100);
    const id = await stashOriginal(text, dir);
    expect(await retrieve(id, dir)).toBe(text);
  });

  it("is idempotent — same content yields the same id", async () => {
    const a = await stashOriginal("same", dir);
    const b = await stashOriginal("same", dir);
    expect(a).toBe(b);
    expect(a).toBe(contentId("same"));
  });

  it("returns null for an unknown or malformed id", async () => {
    expect(await retrieve("deadbeef", dir)).toBeNull();
    expect(await retrieve("../etc/passwd", dir)).toBeNull();
  });
});

describe("resolveStoreDir", () => {
  it("prefers an explicit dir, then WINNOW_DIR, then .winnow", () => {
    expect(resolveStoreDir("x", {})).toBe("x");
    expect(resolveStoreDir(undefined, { WINNOW_DIR: "y" })).toBe("y");
    expect(resolveStoreDir(undefined, {})).toBe(".winnow");
  });
});
