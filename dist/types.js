// Core types for winnow. Compression is lossy by design and made lossless-on-demand
// by the reversible store (CCR): the original is stashed under a content id and
// retrieved when the model needs the full text. All of this runs locally — no proxy,
// no API key, no egress.
/** ~4 chars per token — a cheap, provider-agnostic default. Override via a real
 * tokenizer through `CompressOptions.countTokens` when you need exact numbers. */
export function estTokens(text) {
    return Math.ceil(text.length / 4);
}
export const DEFAULTS = {
    minTokens: 400,
    headItems: 3,
    tailItems: 1,
    maxStringLength: 200,
    tabular: false,
    dictionary: false,
};
//# sourceMappingURL=types.js.map