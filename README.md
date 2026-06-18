# winnow

[![ci](https://github.com/jpoindexter/winnow/actions/workflows/ci.yml/badge.svg)](https://github.com/jpoindexter/winnow/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)
![runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)

**Local-first context compression for AI agents.** Keep the signal, winnow the chaff.

Agents burn tokens on fat tool outputs — JSON dumps, logs, file reads, RAG chunks, conversation history. `winnow` compresses that text *before* it reaches the model, cutting tokens by **40–95%** while keeping what matters. It's content-aware, **reversible** (originals are recoverable on demand), and the core has **zero runtime dependencies**. Everything runs on your machine — no proxy, no API key, no egress.

```
your agent / app  →  winnow (local)  →  LLM provider
```

## Why

Compression that silently drops the wrong line is worse than no compression. `winnow` is built around three ideas:

1. **Content-aware, lossy-but-reversible.** Different compressors for JSON, logs, code, and binary. Every original is stashed locally under a content id, so the model can retrieve the full text the moment it needs detail. Lossy inline, lossless on demand.
2. **Delivery is backbone-gated.** *How* a large result is delivered changes accuracy as much as how well it's compressed. Strong models get a short preview + a retrievable pointer; small/distilled models get a larger inline window and are never handed a pointer they won't follow.
3. **Cache-aligned.** A volatile segment (a timestamp, "current" state) early in your prompt invalidates the provider's KV cache every turn. `winnow` aligns a tiered prompt so the stable prefix leads and the cache survives.

## Install

```bash
npm install winnow
```

Node ≥ 18, ESM. Core has no runtime deps. Code (AST) compression uses an optional `typescript` peer.

## Quickstart

```ts
import { compress, retrieve, stats } from "winnow";

const huge = JSON.stringify(await fetchManyRows()); // e.g. 200 similar objects

const r = await compress(huge);
console.log(r.text);          // head+tail sample, middle elided, + a retrieval footer
console.log(r.compressed);    // true
console.log(stats(huge, r.text)); // { tokensBefore, tokensAfter, tokensSaved, ratio }

// later, if the model needs the full thing:
const original = await retrieve(r.originalId!);
```

Compress a whole chat array:

```ts
import { compressMessages } from "winnow";
const slim = await compressMessages(messages); // compresses each message's content
```

## Benchmark — measured, not claimed

`winnow bench` runs a fidelity harness: for each case it records token savings and checks whether the "needle" (the fact a model would need) **survives compression inline**. Anything elided is still recoverable from the store, so *recoverable* fidelity is 100% by construction — this measures the harder number, what survives **without** a retrieval round-trip.

```
winnow fidelity — 6 cases
  json-head    json  save  86%  inline ✓
  json-tail    json  save  86%  inline ✓
  json-middle  json  save  86%  inline · (recoverable)
  log-error    logs  save  99%  inline ✓
  log-dupes    logs  save  99%  inline ✓
  text-prose   text  save   0%  inline ✓

avg savings: 76%   inline needle survival: 83%
by position: head 100% · tail 100% · middle 0% · anywhere 100%
recoverable fidelity: 100% (every elided original is retrievable from the store)
```

The honest tradeoff is visible: a needle buried deep in the middle of a 200-row array is elided inline — and recoverable in one `retrieve` call. Logs and head/tail JSON keep their signal at a fraction of the tokens.

## API

| Export | What it does |
|---|---|
| `compress(text, opts?)` | Reversible compress of one block; returns `{ text, compressed, originalId, tokensBefore, tokensAfter }`. |
| `compressMessages(messages, opts?)` | Compress each `{ content }` in a chat array. |
| `retrieve(id, dir?)` | Read a stored original back by id. |
| `stats(before, after)` | Token savings + ratio. |
| `compressText(text, opts?)` | Pure router (no I/O, no stashing). `opts.tabular` → lossless TOON. |
| `crushJson` / `squashLogs` / `compressCode` | Individual compressors. |
| `encodeTable` / `decodeTable` / `toonCompress` | **TOON** — lossless object-array ↔ table (keeps every row). |
| `dedupeBlocks` / `rehydrateBlocks` / `dedupeMessages` | Collapse repeated blocks/messages anywhere; reversible. |
| `compactHistory(messages, opts?)` | Anchored history compaction (injected summarizer, extractive fallback). |
| `pruneText(text, opts?)` | LLMLingua-style score-and-drop; **inject your own scorer**, heuristic fallback. |
| `makeCounter(encode?)` / `countTokens` | Token counting — exact with an injected encoder. |
| `tuneOptions(cases?, grid?, weight?)` | Pick compression options that maximize measured survival × savings. |
| `offload(text, opts?)` | Size-based offload with the backbone-gated delivery policy. |
| `resolveDelivery` / `classifyBackbone` | The delivery policy primitives. |
| `alignSegments(segments)` | Cache-align a tiered prompt; returns the prompt, stable-prefix `cacheKey`, and breakpoint. |

`CompressOptions`: `minTokens` (default 400), `headItems` (3), `tailItems` (1), `maxStringLength` (200).

### Cache alignment

```ts
import { alignSegments, cacheHolds } from "winnow";

const aligned = alignSegments([
  { id: "system", text: SYSTEM, stable: true },
  { id: "tools",  text: TOOLS,  stable: true },
  { id: "clock",  text: now(),  stable: false }, // moved after the stable prefix
]);
aligned.prompt;     // stable segments first → cacheable prefix
aligned.cacheKey;   // equal across turns ⇒ the KV cache can hit
cacheHolds(lastKey, aligned); // did the cached prefix survive this turn?
```

## CLI

```bash
winnow bench                 # fidelity benchmark (savings + needle survival)
cat big.json | winnow compress   # compress stdin → stdout (stats on stderr)
winnow retrieve <id>         # print a stored original
winnow mcp                   # start the MCP server (stdio)
```

## MCP server

Expose `winnow` to any MCP client (editors, agent runtimes) as three tools — `winnow_compress`, `winnow_retrieve`, `winnow_stats`:

```bash
winnow mcp
```

```jsonc
// in your client's MCP config
{ "mcpServers": { "winnow": { "command": "winnow", "args": ["mcp"] } } }
```

## Design notes

- **Lossy inline, lossless on demand.** Compression always shrinks; the original is one `retrieve` away. The compressor never keeps a result that didn't actually shrink.
- **Read-fidelity is a contract.** Precision matters most for code and exact reads — code compression keeps every signature/type/import and only elides bodies (recoverable), so the model still sees the shape.
- **Local-first.** Originals live in `.winnow/ccr/` (override with `WINNOW_DIR`). Nothing leaves your machine.
- **Token counts** default to a `length/4` heuristic; swap in a real tokenizer where exact numbers matter.

## License

MIT © Jason Poindexter
