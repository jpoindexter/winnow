import { createHash } from "node:crypto";

// Cache-aligner — provider KV-caches only hit on a byte-identical PREFIX. If a volatile
// segment (timestamps, "current" state, the latest turn) sits early in the prompt, it
// invalidates the cache for everything after it every turn. This aligns a tiered prompt
// so all stable segments lead, computes the stable-prefix key, and tells you where to
// place the cache breakpoint. Pure — no provider calls.

export interface Segment {
  /** A label for the segment (e.g. "system", "tools", "goals"). */
  id: string;
  text: string;
  /** True if the segment changes turn-to-turn (don't let it gate the cache). */
  stable: boolean;
}

export interface AlignedPrompt {
  /** Full prompt: stable segments first (in order), then volatile (in order). */
  prompt: string;
  /** Hash of the concatenated stable prefix — equal across turns ⇒ cache can hit. */
  cacheKey: string;
  /** Char length of the stable prefix — where a provider cache breakpoint belongs. */
  breakpoint: number;
  /** Ids reordered later than they appeared (a hint that the prompt should be retiered). */
  movedVolatile: string[];
}

const SEP = "\n\n";

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * Reorder segments so every stable one precedes every volatile one (stable original
 * order preserved), so a single volatile segment can't bust the cached prefix. Pure.
 */
export function alignSegments(segments: Segment[]): AlignedPrompt {
  const stable = segments.filter((s) => s.stable);
  const volatile = segments.filter((s) => !s.stable);
  const stableText = stable.map((s) => s.text).join(SEP);
  const prompt = [...stable, ...volatile].map((s) => s.text).join(SEP);
  // volatile segments that had a stable segment AFTER them in the original order were
  // busting the cache every turn; those are the ones alignment moved.
  const movedVolatile = segments
    .filter((s, i) => !s.stable && segments.slice(i + 1).some((later) => later.stable))
    .map((s) => s.id);
  return { prompt, cacheKey: hash(stableText), breakpoint: stableText.length, movedVolatile };
}

/** True when the stable prefix is byte-identical to last turn ⇒ the KV cache survives. */
export function cacheHolds(previousKey: string | undefined, current: AlignedPrompt): boolean {
  return previousKey !== undefined && previousKey === current.cacheKey;
}
