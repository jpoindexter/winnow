import type { CompressOptions } from "./types.js";
/**
 * Compress a JSON string into re-serialized crushed JSON, or return the original
 * unchanged when it doesn't parse (the router then falls back to log/text). Pure.
 */
export declare function crushJson(raw: string, options?: CompressOptions): string;
