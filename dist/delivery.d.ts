export type Backbone = "strong" | "weak";
export type DeliveryMode = "inline" | "file";
/** Classify a model id as a strong or weak backbone. Only clearly-small models are
 * gated weak (distilled variants like *-mini / *-haiku match); everything else —
 * including unknown ids — is strong. Pure. */
export declare function classifyBackbone(modelId: string): Backbone;
/** Inline window for a weak backbone's truncated (self-contained) delivery. */
export declare const WEAK_INLINE_CHARS = 8000;
/** Inline preview kept above a strong backbone's file pointer. */
export declare const FILE_PREVIEW_CHARS = 2000;
export interface DeliveryOptions {
    /** Active model id — drives the strong/weak gate. Unknown → strong. */
    modelId?: string;
    /** Force a mode regardless of backbone ("inline" | "file"). */
    force?: DeliveryMode;
}
/** Decide how an oversized result is delivered. Pure. */
export declare function resolveDelivery(opts?: DeliveryOptions): {
    mode: DeliveryMode;
    inlineChars: number;
};
