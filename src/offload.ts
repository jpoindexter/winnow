import { stashOriginal } from "./store.js";
import { resolveDelivery, type DeliveryMode, type DeliveryOptions } from "./delivery.js";

// Size-based offload — the lossless, all-content backstop. Anything over the char
// limit (a 60K file read, a noisy log dump) is stashed whole and delivered per the
// backbone gate: a strong backbone gets a short preview + a retrievable path; a weak
// backbone gets a larger inline window and never a file-only pointer. Best-effort: a
// stash failure returns the text untouched.

export const DEFAULT_MAX_CHARS = 50_000;
const FILE_PREVIEW = 2_000;

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
export function summarize(text: string): string {
  const line = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  return line.length > 160 ? line.slice(0, 160) + "…" : line;
}

/**
 * Offload an oversized output. Under the limit → returned unchanged (inline is the
 * default). Over the limit → stashed whole, then delivered by the backbone gate.
 */
export async function offload(text: string, opts: OffloadOptions = {}): Promise<OffloadResult> {
  const max = opts.maxChars ?? DEFAULT_MAX_CHARS;
  if (text.length <= max) return { offloaded: false, output: text };
  try {
    const id = await stashOriginal(text, opts.dir);
    const { mode, inlineChars } = resolveDelivery(opts);
    const preview = text.slice(0, Math.max(inlineChars, FILE_PREVIEW));
    const path = `.winnow/ccr/${id}.txt.gz`; // gzipped on disk — read it back via winnow_retrieve
    const footer = mode === "file"
      ? `\n\n[output truncated: ${text.length} chars. summary: ${summarize(text)}\n` +
        `full result stored at ${path} — id="${id}", call winnow_retrieve to read it all]`
      : `\n\n[output truncated to ${preview.length} of ${text.length} chars to fit a smaller model; ` +
        `full copy stored at ${path} (id="${id}")]`;
    return { offloaded: true, output: preview + footer, delivery: mode };
  } catch {
    return { offloaded: false, output: text };
  }
}
