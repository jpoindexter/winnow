import { type CompressOptions } from "../types.js";
import { type BenchCase, type Position } from "./corpus.js";
export interface CaseResult {
    id: string;
    kind: BenchCase["kind"];
    where: Position;
    ratio: number;
    inlineSurvived: boolean;
}
export interface FidelityReport {
    cases: CaseResult[];
    /** Mean fraction of tokens removed across the corpus, 0..1. */
    avgRatio: number;
    /** Fraction of needles that survived inline (no retrieval needed), 0..1. */
    inlineSurvival: number;
    /** Inline survival split by needle position. */
    byPosition: Partial<Record<Position, number>>;
    /** Cost-Normalized Gain vs uncompressed: quality kept per token saved (0 = lossless). */
    cng: number;
}
/** Run the fidelity bench over the corpus (or a supplied set). Pure given the corpus. */
export declare function runFidelity(cases?: BenchCase[], opts?: CompressOptions): FidelityReport;
/** One-line-per-case table + summary. Pure. */
export declare function formatFidelity(r: FidelityReport): string;
