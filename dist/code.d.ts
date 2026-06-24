/** True when the text looks like TS/JS source worth AST-compressing. Pure, cheap. */
export declare function isCodeContent(text: string): boolean;
/**
 * Replace every block function/method/arrow body with a marker, keeping signatures.
 * Returns the compressed source, or null if `typescript` isn't available or it doesn't
 * shrink. Async because the typescript dep is imported lazily.
 */
export declare function compressCode(source: string): Promise<string | null>;
