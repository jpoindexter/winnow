export interface DedupResult {
    text: string;
    /** Unique blocks in first-seen order; markers `⟦↺#k⟧` reference refs[k]. */
    refs: string[];
    /** Count of blocks replaced by a reference. */
    deduped: number;
}
/**
 * Collapse repeated blocks (split on blank lines). The first occurrence stays inline;
 * later identical blocks become `⟦↺#k⟧` referencing the first. Blocks shorter than
 * `minLen` are left untouched. Pure.
 */
export declare function dedupeBlocks(text: string, opts?: {
    minLen?: number;
}): DedupResult;
/** Restore the exact original from a deduped text + its refs. Inverse of dedupeBlocks. */
export declare function rehydrateBlocks(text: string, refs: string[]): string;
/** Dedup repeated message contents across a chat array (e.g. a re-read file). Reversible
 * via the returned refs. Pure. */
export declare function dedupeMessages<T extends {
    content: string;
}>(messages: T[], opts?: {
    minLen?: number;
}): {
    messages: T[];
    refs: string[];
    deduped: number;
};
