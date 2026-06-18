import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleMessage } from "./server.js";

function parse(line: string | null): { result?: Record<string, unknown>; error?: unknown } {
  return JSON.parse(line ?? "{}");
}

describe("MCP handleMessage", () => {
  let prev: string | undefined;
  beforeEach(async () => { prev = process.env.WINNOW_DIR; process.env.WINNOW_DIR = await mkdtemp(join(tmpdir(), "winnow-mcp-")); });
  afterEach(async () => { await rm(process.env.WINNOW_DIR!, { recursive: true, force: true }); if (prev === undefined) delete process.env.WINNOW_DIR; else process.env.WINNOW_DIR = prev; });

  it("responds to initialize with serverInfo", async () => {
    const r = parse(await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize" }));
    expect((r.result as { serverInfo: { name: string } }).serverInfo.name).toBe("winnow");
  });

  it("lists the three tools", async () => {
    const r = parse(await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
    const names = (r.result as { tools: { name: string }[] }).tools.map((t) => t.name);
    expect(names).toEqual(["winnow_compress", "winnow_retrieve", "winnow_stats"]);
  });

  it("compresses then retrieves round-trip via tools/call", async () => {
    const big = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `n${i}` })));
    const c = parse(await handleMessage({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "winnow_compress", arguments: { text: big } } }));
    const text = (c.result as { content: { text: string }[] }).content[0]!.text;
    const id = /id="([a-f0-9]+)"/.exec(text)?.[1];
    expect(id).toBeTruthy();
    const got = parse(await handleMessage({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "winnow_retrieve", arguments: { id } } }));
    expect((got.result as { content: { text: string }[] }).content[0]!.text).toBe(big);
  });

  it("returns null for a notification (no id)", async () => {
    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
  });

  it("errors on an unknown method", async () => {
    const r = parse(await handleMessage({ jsonrpc: "2.0", id: 5, method: "bogus" }));
    expect(r.error).toBeTruthy();
  });
});
