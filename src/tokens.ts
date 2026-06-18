// Token counting. The default is a provider-agnostic length/4 heuristic — fine for
// relative savings, off by a bit in absolutes. For exact numbers, inject a real encoder
// (e.g. gpt-tokenizer's `encode`, a pure-JS optional peer) via `makeCounter`. Pure.

export type Encoder = (text: string) => ArrayLike<unknown>;

/** ~4 chars per token. Pure. */
export function heuristicCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build a token counter. With an encoder, returns the exact token count; without one,
 * falls back to the heuristic (and stays safe if the encoder throws).
 */
export function makeCounter(encode?: Encoder): (text: string) => number {
  if (!encode) return heuristicCount;
  return (text: string) => {
    try {
      return encode(text).length;
    } catch {
      return heuristicCount(text);
    }
  };
}

/** Default counter (heuristic). Override per call site with makeCounter(encode). */
export const countTokens = makeCounter();
