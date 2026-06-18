// Cost-Normalized Gain (S2L, arXiv:2606.16769). Compression is a trade: tokens down,
// maybe quality down. CNG measures quality gained (or lost) PER unit of relative
// token-cost change — so a method that saves tokens without losing quality scores well,
// and one that saves tokens by dropping needed info is penalized. Pure.
//
//   CNG = (quality_cond - quality_base) / (|relCostChangePct| / 100)
//
// quality is any 0..1 score (pass rate, needle survival, recall). relCostChangePct is the
// % change in token cost vs the baseline (negative when compression saves tokens).

const EPS = 1e-9;

export function costNormalizedGain(
  baseQuality: number,
  condQuality: number,
  relCostChangePct: number,
): number {
  const gain = condQuality - baseQuality;
  const cost = Math.abs(relCostChangePct) / 100;
  // No cost change → CNG is just the raw quality gain (avoid div-by-zero blow-up).
  return cost < EPS ? gain : gain / cost;
}

/** CNG of a compression result vs the uncompressed baseline: quality 1.0 (everything is
 * present uncompressed) and a cost reduction of `savedRatio` (0..1). Pure. */
export function compressionCng(condQuality: number, savedRatio: number): number {
  return costNormalizedGain(1, condQuality, -savedRatio * 100);
}
