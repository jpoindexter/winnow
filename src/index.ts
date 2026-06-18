// winnow — local-first context compression for AI agents. Keep the signal, winnow the
// chaff. Content-aware, reversible (originals recoverable on demand), zero runtime deps
// in the core. This module is the public API.

import { applyCompression, type ApplyOptions } from "./apply.js";
import { estTokens } from "./types.js";

export { estTokens, DEFAULTS } from "./types.js";
export type { ContentType, CompressOptions, CompressResult } from "./types.js";

// Pure compressors + router
export { compressText, detectContentType, binaryStub } from "./router.js";
export { crushJson } from "./json-crush.js";
export { squashLogs } from "./log-squash.js";
export { compressCode, isCodeContent } from "./code.js";

// Lossless tabular transcoding (TOON) — plain + columnar (TOONC) for low-cardinality data
export { encodeTable, decodeTable, toonCompress, isObjectArray, encodeColumnar, decodeColumnar } from "./toon.js";

// Cross-context dedup
export { dedupeBlocks, rehydrateBlocks, dedupeMessages } from "./dedup.js";
export type { DedupResult } from "./dedup.js";

// Conversation-history compaction
export { compactHistory } from "./history.js";
export type { Msg, CompactOptions } from "./history.js";

// Token pruning (LLMLingua-style; scorer injected)
export { pruneText } from "./prune.js";
export type { TokenScorer, PruneOptions, PruneResult } from "./prune.js";

// Token counting (heuristic default; inject a real encoder for exact counts)
export { makeCounter, heuristicCount, countTokens } from "./tokens.js";
export type { Encoder } from "./tokens.js";

// Adaptive, bench-driven option tuning
export { tuneOptions, DEFAULT_GRID } from "./adapt.js";
export type { TuneResult } from "./adapt.js";

// Reversible store
export { retrieve, stashOriginal, contentId, resolveStoreDir } from "./store.js";

// Delivery + offload
export { offload, summarize, DEFAULT_MAX_CHARS } from "./offload.js";
export type { OffloadOptions, OffloadResult } from "./offload.js";
export {
  resolveDelivery, classifyBackbone, WEAK_INLINE_CHARS, FILE_PREVIEW_CHARS,
} from "./delivery.js";
export type { Backbone, DeliveryMode, DeliveryOptions } from "./delivery.js";

// Cache alignment
export { alignSegments, cacheHolds } from "./cache.js";
export type { Segment, AlignedPrompt } from "./cache.js";

// The reversible compressor is the headline entry point.
export { applyCompression };
export type { ApplyOptions };

/** Headline API: compress one block of text, reversibly. Alias of applyCompression. */
export const compress = applyCompression;

export interface Savings {
  tokensBefore: number;
  tokensAfter: number;
  tokensSaved: number;
  /** Fraction removed, 0..1 (e.g. 0.62 = 62% smaller). */
  ratio: number;
}

/** Token savings between an original and its compressed form. Pure. */
export function stats(before: string, after: string): Savings {
  const tokensBefore = estTokens(before);
  const tokensAfter = estTokens(after);
  const tokensSaved = Math.max(0, tokensBefore - tokensAfter);
  return {
    tokensBefore,
    tokensAfter,
    tokensSaved,
    ratio: tokensBefore ? tokensSaved / tokensBefore : 0,
  };
}

/** Compress every message's content in a chat array, reversibly. Convenience over
 * applyCompression for the common `messages` shape. */
export async function compressMessages<T extends { content: string }>(
  messages: T[],
  opts: ApplyOptions = {},
): Promise<T[]> {
  return Promise.all(
    messages.map(async (m) => ({ ...m, content: (await applyCompression(m.content, opts)).text })),
  );
}
