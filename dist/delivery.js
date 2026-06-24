// Delivery policy — HOW a large result is delivered shifts end-to-end accuracy as much
// as how well it's compressed. Inline wins broadly; file-based (programmatic) delivery
// only pays off when the model reliably closes the read→integrate→retry loop. Small /
// distilled backbones regress with it. So: inline by default; a strong backbone may
// offload to a retrievable pointer; a weak backbone gets a larger inline window and is
// never handed a file-only pointer it won't follow. Pure, size- and backbone-keyed.
// Small / distilled models that don't reliably follow a retrieval pointer. Anything
// not matched here is treated as strong (frontier/large) — the default.
const WEAK_PATTERNS = [
    /\bmini\b/i, /haiku/i, /flash-?lite/i, /\bnano\b/i, /gemma/i, /\bphi-?\d/i,
    /mistral-7b/i, /:(?:0\.\d|[1-9]|1[0-4])b\b/i, /\b[1-9]b\b/i, /\b1[0-4]b\b/i,
];
/** Classify a model id as a strong or weak backbone. Only clearly-small models are
 * gated weak (distilled variants like *-mini / *-haiku match); everything else —
 * including unknown ids — is strong. Pure. */
export function classifyBackbone(modelId) {
    return WEAK_PATTERNS.some((re) => re.test(modelId)) ? "weak" : "strong";
}
/** Inline window for a weak backbone's truncated (self-contained) delivery. */
export const WEAK_INLINE_CHARS = 8_000;
/** Inline preview kept above a strong backbone's file pointer. */
export const FILE_PREVIEW_CHARS = 2_000;
/** Decide how an oversized result is delivered. Pure. */
export function resolveDelivery(opts = {}) {
    const mode = opts.force ?? (classifyBackbone(opts.modelId ?? "") === "strong" ? "file" : "inline");
    return { mode, inlineChars: mode === "file" ? FILE_PREVIEW_CHARS : WEAK_INLINE_CHARS };
}
//# sourceMappingURL=delivery.js.map