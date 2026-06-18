// Conversation-history compaction (anchored iterative summarization). Keep the most
// recent turns verbatim; fold everything older into ONE structured summary. "Anchored"
// = you pass the prior summary back in and only the newly-evicted span is merged, so the
// summary grows incrementally instead of being recomputed from scratch. The summarizer is
// INJECTED (use your LLM); a deterministic extractive fallback runs when none is given, so
// the library has no model dependency. Pure given the injected summarizer.

export interface Msg { role: string; content: string }

export interface CompactOptions {
  /** Recent messages kept verbatim. Default 6. */
  keepRecent?: number;
  /** Summarize the evicted span. Omit for the extractive fallback. */
  summarize?: (text: string) => string | Promise<string>;
  /** Prior anchored summary to merge the newly-evicted span into. */
  priorSummary?: string;
}

const DEFAULT_KEEP = 6;
const SUMMARY_ROLE = "system";
const SUMMARY_PREFIX = "Earlier conversation (compacted):";

function firstSentence(text: string): string {
  const s = text.trim().replace(/\s+/g, " ");
  const end = s.search(/[.!?](\s|$)/);
  const out = end >= 0 ? s.slice(0, end + 1) : s;
  return out.length > 200 ? out.slice(0, 200) + "…" : out;
}

/** Deterministic, model-free summary: one bullet per evicted message. Pure. */
function extractiveSummary(evicted: Msg[]): string {
  const bullets = evicted.map((m) => `- ${m.role}: ${firstSentence(m.content)}`).join("\n");
  return `${SUMMARY_PREFIX}\n${bullets}`;
}

/**
 * Compact a chat array: keep the last `keepRecent` messages verbatim, fold older ones
 * into a single summary message (merged with `priorSummary` when given). Returns the new
 * message array; the summary message leads. Best-effort: a summarizer error falls back to
 * the extractive summary.
 */
export async function compactHistory(messages: Msg[], opts: CompactOptions = {}): Promise<Msg[]> {
  const keep = opts.keepRecent ?? DEFAULT_KEEP;
  if (messages.length <= keep) return messages;
  const evicted = messages.slice(0, messages.length - keep);
  const recent = messages.slice(messages.length - keep);

  let summaryBody: string;
  if (opts.summarize) {
    const span = evicted.map((m) => `${m.role}: ${m.content}`).join("\n");
    const input = opts.priorSummary ? `${opts.priorSummary}\n\n--- new ---\n${span}` : span;
    try {
      summaryBody = `${SUMMARY_PREFIX}\n${(await opts.summarize(input)).trim()}`;
    } catch {
      summaryBody = extractiveSummary(evicted);
    }
  } else {
    const extractive = extractiveSummary(evicted);
    summaryBody = opts.priorSummary ? `${opts.priorSummary}\n${extractive.slice(SUMMARY_PREFIX.length + 1)}` : extractive;
  }
  return [{ role: SUMMARY_ROLE, content: summaryBody }, ...recent];
}
