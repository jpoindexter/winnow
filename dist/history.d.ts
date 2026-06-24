export interface Msg {
    role: string;
    content: string;
}
export interface CompactOptions {
    /** Recent messages kept verbatim. Default 6. */
    keepRecent?: number;
    /** Summarize the evicted span. Omit for the extractive fallback. */
    summarize?: (text: string) => string | Promise<string>;
    /** Prior anchored summary to merge the newly-evicted span into. */
    priorSummary?: string;
}
/**
 * Compact a chat array: keep the last `keepRecent` messages verbatim, fold older ones
 * into a single summary message (merged with `priorSummary` when given). Returns the new
 * message array; the summary message leads. Best-effort: a summarizer error falls back to
 * the extractive summary.
 */
export declare function compactHistory(messages: Msg[], opts?: CompactOptions): Promise<Msg[]>;
