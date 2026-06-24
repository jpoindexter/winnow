import { createHash } from "node:crypto";
const SEP = "\n\n";
function hash(text) {
    return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
/**
 * Reorder segments so every stable one precedes every volatile one (stable original
 * order preserved), so a single volatile segment can't bust the cached prefix. Pure.
 */
export function alignSegments(segments) {
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
export function cacheHolds(previousKey, current) {
    return previousKey !== undefined && previousKey === current.cacheKey;
}
//# sourceMappingURL=cache.js.map