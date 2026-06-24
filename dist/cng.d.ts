export declare function costNormalizedGain(baseQuality: number, condQuality: number, relCostChangePct: number): number;
/** CNG of a compression result vs the uncompressed baseline: quality 1.0 (everything is
 * present uncompressed) and a cost reduction of `savedRatio` (0..1). Pure. */
export declare function compressionCng(condQuality: number, savedRatio: number): number;
