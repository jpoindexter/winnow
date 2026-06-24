import type { CompressOptions, CompressResult } from "./types.js";
export interface ApplyOptions extends CompressOptions {
    /** Store directory (defaults to WINNOW_DIR or `.winnow`). */
    dir?: string;
}
/**
 * Compress a single block and make it reversible. On a real shrink, returns the
 * compressed text with a `[winnow ...; id="..."]` footer and `originalId` set, and
 * stashes the original. Otherwise returns the input unchanged.
 */
export declare function applyCompression(raw: string, options?: ApplyOptions): Promise<CompressResult>;
