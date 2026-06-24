import type { CompressOptions, CompressResult, ContentType } from "./types.js";
/** Classify text into a content type. Pure, cheap, best-effort. */
export declare function detectContentType(text: string): ContentType;
/** Elision stub for a binary blob — the model gets a pointer, not garbage. Pure. */
export declare function binaryStub(text: string): string;
/**
 * Compress one block of text. Pure — no I/O, no stashing. Returns `compressed:false`
 * when below the token floor or when the transform didn't shrink it, so the caller
 * never stashes or rewrites pointlessly.
 */
export declare function compressText(raw: string, options?: CompressOptions): CompressResult;
