// Core types for winnow. Compression is lossy by design and made lossless-on-demand
// by the reversible store (CCR): the original is stashed under a content id and
// retrieved when the model needs the full text. All of this runs locally — no proxy,
// no API key, no egress.

/** ~4 chars per token — a cheap, provider-agnostic default. Override via a real
 * tokenizer through `CompressOptions.countTokens` when you need exact numbers. */
export function estTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Content classes the router recognizes; each picks a compressor. */
export type ContentType = "json" | "logs" | "text" | "binary" | "code";

export interface CompressResult {
  /** The compressed text, or the original when compression wasn't worth it. */
  text: string;
  contentType: ContentType;
  tokensBefore: number;
  tokensAfter: number;
  /** True only when compression actually ran and shrank the text. */
  compressed: boolean;
  /** Store id to retrieve the original — set by the reversible wrapper, not the core. */
  originalId?: string;
}

export interface CompressOptions {
  /** Below this token count, skip compression entirely. Default 400. */
  minTokens?: number;
  /** Array-of-objects: keep this many from the head. Default 3. */
  headItems?: number;
  /** Array-of-objects: keep this many from the tail. Default 1. */
  tailItems?: number;
  /** Truncate string values longer than this. Default 200. */
  maxStringLength?: number;
}

export const DEFAULTS: Required<CompressOptions> = {
  minTokens: 400,
  headItems: 3,
  tailItems: 1,
  maxStringLength: 200,
};
