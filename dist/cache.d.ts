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
/**
 * Reorder segments so every stable one precedes every volatile one (stable original
 * order preserved), so a single volatile segment can't bust the cached prefix. Pure.
 */
export declare function alignSegments(segments: Segment[]): AlignedPrompt;
/** True when the stable prefix is byte-identical to last turn ⇒ the KV cache survives. */
export declare function cacheHolds(previousKey: string | undefined, current: AlignedPrompt): boolean;
