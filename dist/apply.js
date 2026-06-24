import { compressText } from "./router.js";
import { stashOriginal } from "./store.js";
/**
 * Compress a single block and make it reversible. On a real shrink, returns the
 * compressed text with a `[winnow ...; id="..."]` footer and `originalId` set, and
 * stashes the original. Otherwise returns the input unchanged.
 */
export async function applyCompression(raw, options = {}) {
    try {
        const result = compressText(raw, options);
        if (!result.compressed)
            return result;
        const id = await stashOriginal(raw, options.dir);
        const footer = `\n\n[winnow: ${result.tokensBefore}→${result.tokensAfter} tokens (${result.contentType}); ` +
            `id="${id}", call winnow_retrieve to expand]`;
        return { ...result, text: result.text + footer, originalId: id };
    }
    catch {
        return { text: raw, contentType: "text", tokensBefore: 0, tokensAfter: 0, compressed: false };
    }
}
//# sourceMappingURL=apply.js.map