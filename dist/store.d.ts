/** Resolve the store root: explicit arg → WINNOW_DIR env → `.winnow`. */
export declare function resolveStoreDir(dir?: string, env?: NodeJS.ProcessEnv): string;
/** Short, stable content id (sha256 prefix). Pure. */
export declare function contentId(text: string): string;
/**
 * Stash the original text under its content id. Idempotent (same content → same id →
 * same file). Returns the id. Best-effort: a write failure is non-fatal.
 */
export declare function stashOriginal(text: string, dir?: string): Promise<string>;
/** Retrieve a stashed original by id, or null if unknown. Reads the gzipped stash, then
 * falls back to a legacy plaintext stash. */
export declare function retrieve(id: string, dir?: string): Promise<string | null>;
