import { createInterface } from "node:readline";
import { applyCompression } from "../apply.js";
import { retrieve } from "../store.js";
import { stats } from "../index.js";

// MCP server (stdio, dependency-free) exposing winnow as three tools to any MCP client:
//   winnow_compress  — compress text, reversibly (returns the compressed text + id)
//   winnow_retrieve  — read a stored original back by id
//   winnow_stats     — token savings between an original and its compressed form
// Newline-delimited JSON-RPC 2.0 over stdin/stdout. Local-first: no network, no egress.

const PROTOCOL_VERSION = "2024-11-05";
const SERVER = { name: "winnow", version: "0.7.0" };

const TOOLS = [
  {
    name: "winnow_compress",
    description: "Compress fat text (JSON, logs, prose) before it enters context. Reversible — returns a retrieval id.",
    inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  },
  {
    name: "winnow_retrieve",
    description: "Read back the full original text for a winnow id (expand a previously compressed result).",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "winnow_stats",
    description: "Report token savings between an original and its compressed form.",
    inputSchema: { type: "object", properties: { before: { type: "string" }, after: { type: "string" } }, required: ["before", "after"] },
  },
];

type Rpc = { jsonrpc: "2.0"; id?: number | string; method?: string; params?: Record<string, unknown> };

function ok(id: Rpc["id"], result: unknown): string {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}
function err(id: Rpc["id"], message: string): string {
  return JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } });
}
function textResult(text: string): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text }] };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === "winnow_compress") {
    const r = await applyCompression(String(args.text ?? ""));
    return textResult(r.text);
  }
  if (name === "winnow_retrieve") {
    const original = await retrieve(String(args.id ?? ""));
    return textResult(original ?? `(no stored original for id "${String(args.id ?? "")}")`);
  }
  if (name === "winnow_stats") {
    return textResult(JSON.stringify(stats(String(args.before ?? ""), String(args.after ?? ""))));
  }
  throw new Error(`unknown tool: ${name}`);
}

/** Handle one JSON-RPC message; returns the response line, or null for notifications. */
export async function handleMessage(msg: Rpc): Promise<string | null> {
  if (msg.id === undefined) return null; // notification — no response
  try {
    if (msg.method === "initialize") {
      return ok(msg.id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER });
    }
    if (msg.method === "tools/list") return ok(msg.id, { tools: TOOLS });
    if (msg.method === "tools/call") {
      const p = msg.params ?? {};
      const result = await callTool(String(p.name ?? ""), (p.arguments as Record<string, unknown>) ?? {});
      return ok(msg.id, result);
    }
    return err(msg.id, `unknown method: ${msg.method}`);
  } catch (e) {
    return err(msg.id, e instanceof Error ? e.message : String(e));
  }
}

/** Start the stdio MCP server. Resolves when stdin closes. */
export function startMcpServer(): Promise<void> {
  const rl = createInterface({ input: process.stdin });
  return new Promise((resolve) => {
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let msg: Rpc;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        return;
      }
      void handleMessage(msg).then((out) => {
        if (out) process.stdout.write(out + "\n");
      });
    });
    rl.on("close", () => resolve());
  });
}
