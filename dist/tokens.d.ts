export type Encoder = (text: string) => ArrayLike<unknown>;
/** ~4 chars per token. Pure. */
export declare function heuristicCount(text: string): number;
/**
 * Build a token counter. With an encoder, returns the exact token count; without one,
 * falls back to the heuristic (and stays safe if the encoder throws).
 */
export declare function makeCounter(encode?: Encoder): (text: string) => number;
/** Default counter (heuristic). Override per call site with makeCounter(encode). */
export declare const countTokens: (text: string) => number;
