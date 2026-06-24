import { type DeliveryMode, type DeliveryOptions } from "./delivery.js";
export declare const DEFAULT_MAX_CHARS = 50000;
export interface OffloadOptions extends DeliveryOptions {
    /** Char budget before offload kicks in. Default 50k. */
    maxChars?: number;
    /** Store directory (defaults to WINNOW_DIR or `.winnow`). */
    dir?: string;
}
export interface OffloadResult {
    offloaded: boolean;
    output: string;
    delivery?: DeliveryMode;
}
/** A one-line summary of an oversized output: first non-empty line, clipped. Pure. */
export declare function summarize(text: string): string;
/**
 * Offload an oversized output. Under the limit → returned unchanged (inline is the
 * default). Over the limit → stashed whole, then delivered by the backbone gate.
 */
export declare function offload(text: string, opts?: OffloadOptions): Promise<OffloadResult>;
