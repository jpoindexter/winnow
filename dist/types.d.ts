/** ~4 chars per token — a cheap, provider-agnostic default. Override via a real
 * tokenizer through `CompressOptions.countTokens` when you need exact numbers. */
export declare function estTokens(text: string): number;
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
    /** Object-arrays: transcode to a lossless TOON table (keep every row) instead of
     * eliding the middle. Default false (the crusher's elision stays the default). */
    tabular?: boolean;
    /** With tabular: also try columnar (TOONC) encoding and keep whichever is smaller —
     * bigger win on low-cardinality data, at some readability cost. Default false. */
    dictionary?: boolean;
}
export declare const DEFAULTS: Required<CompressOptions>;
