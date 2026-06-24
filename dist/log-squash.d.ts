/**
 * Squash log/text output: collapse blank-line runs (the real win on transcripts and
 * verbose output), then duplicate lines, then deep stack traces. Pure.
 */
export declare function squashLogs(raw: string): string;
