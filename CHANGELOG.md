# Changelog

All notable changes to winnow are documented here. Versions follow [semver](https://semver.org).

## 0.3.0 — compression-technique expansion

### Tier 1 — deterministic, lossless/reversible
- **TOON tabular transcoding** (`encodeTable`/`decodeTable`/`toonCompress`) — re-encode an
  object-array as a delimited table: keys once + one line per row. Keeps EVERY row and is
  fully lossless (types/nesting/null-vs-missing survive). Opt-in via `compress(text,{tabular:true})`.
- **Cross-context dedup** (`dedupeBlocks`/`rehydrateBlocks`/`dedupeMessages`) — collapse
  repeated blocks anywhere (and repeated messages across a chat), not just adjacent lines;
  reversible.
- **History compaction** (`compactHistory`) — anchored iterative summarization for a chat
  array: keep recent turns verbatim, fold older into one summary; injected summarizer with a
  model-free extractive fallback.

### Tier 2 — pluggable, model-optional
- **Token pruning** (`pruneText`) — the LLMLingua-style score-and-drop mechanism with an
  INJECTED scorer (bring your small-LM perplexity for LLMLingua-grade) and a model-free
  self-information proxy fallback. Opt-in; protects numbers/code.
- **Accurate token counting** (`makeCounter`/`countTokens`) — heuristic by default, exact
  when you inject a real encoder (e.g. a pure-JS tokenizer).

### Tier 3 — adaptive, measured
- **Bench-driven tuning** (`tuneOptions`) — run candidate option sets through the fidelity
  bench and pick the one maximizing a weighted blend of needle-survival and savings; feed it
  your own traces to tune to your workload.

## 0.2.0

- **CI** across Node 18/20/22 (typecheck → test → build → bench).
- **Robustness suite** — compression never throws on empty, deeply-nested, invalid-JSON,
  unicode/control-char, or syntactically-rough code input; degrades safely.
- Docs: status badges, changelog.

## 0.1.0

Initial release.

- Content-aware compressors: JSON crusher (head/tail sample + elide, union-of-keys
  marker), log/stack squash, binary elision, optional TS/JS AST body-stripping.
- Reversible store (CCR): originals stashed locally, recoverable by id.
- Backbone-gated delivery: strong models get a retrievable pointer; weak models a
  larger inline window (never a file-only pointer they won't follow).
- Cache-aligner: reorder a tiered prompt so the stable prefix leads and the provider
  KV cache survives.
- Fidelity benchmark: measured token savings + needle-survival.
- Surfaces: library API, `winnow` CLI, MCP server (`winnow_compress`/`retrieve`/`stats`).
