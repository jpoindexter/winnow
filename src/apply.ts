import type { CompressOptions, CompressResult } from "./types.js";
import { compressText } from "./router.js";
import { stashOriginal } from "./store.js";

// The reversible wrapper: run the pure router, and on a real shrink stash the original
// and attach the retrieval id + a one-line footer so the model can expand it on demand.
// Best-effort — any failure returns the original untouched (compression must never
// break the caller).

export interface ApplyOptions extends CompressOptions {
  /** Store directory (defaults to WINNOW_DIR or `.winnow`). */
  dir?: string;
}

/**
 * Compress a single block and make it reversible. On a real shrink, returns the
 * compressed text with a `[winnow ...; id="..."]` footer and `originalId` set, and
 * stashes the original. Otherwise returns the input unchanged.
 */
export async function applyCompression(raw: string, options: ApplyOptions = {}): Promise<CompressResult> {
  try {
    const result = compressText(raw, options);
    if (!result.compressed) return result;
    const id = await stashOriginal(raw, options.dir);
    const footer =
      `\n\n[winnow: ${result.tokensBefore}→${result.tokensAfter} tokens (${result.contentType}); ` +
      `id="${id}", call winnow_retrieve to expand]`;
    return { ...result, text: result.text + footer, originalId: id };
  } catch {
    return { text: raw, contentType: "text", tokensBefore: 0, tokensAfter: 0, compressed: false };
  }
}
