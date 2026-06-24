// Cross-context dedup. The log squasher only collapses ADJACENT duplicate lines; this
// collapses repeated BLOCKS anywhere — the same file read three times in a session, a
// boilerplate header pasted into many tool results. Each repeat after the first becomes a
// reference marker; the first copy stays inline so the model can read it. Reversible:
// `rehydrateBlocks` restores the exact original. Pure.
import { createHash } from "node:crypto";
const DEFAULT_MIN_LEN = 40; // don't dedup short blocks — the marker isn't worth it
const MARKER = /⟦↺#(\d+)⟧/g;
function hash(s) {
    return createHash("sha256").update(s).digest("hex").slice(0, 16);
}
/**
 * Collapse repeated blocks (split on blank lines). The first occurrence stays inline;
 * later identical blocks become `⟦↺#k⟧` referencing the first. Blocks shorter than
 * `minLen` are left untouched. Pure.
 */
export function dedupeBlocks(text, opts = {}) {
    const minLen = opts.minLen ?? DEFAULT_MIN_LEN;
    const blocks = text.split("\n\n");
    const indexByHash = new Map();
    const refs = [];
    let deduped = 0;
    const out = blocks.map((block) => {
        if (block.length < minLen)
            return block;
        const h = hash(block);
        const seen = indexByHash.get(h);
        if (seen !== undefined) {
            deduped++;
            return `⟦↺#${seen}⟧`;
        }
        indexByHash.set(h, refs.length);
        refs.push(block);
        return block;
    });
    return { text: out.join("\n\n"), refs, deduped };
}
/** Restore the exact original from a deduped text + its refs. Inverse of dedupeBlocks. */
export function rehydrateBlocks(text, refs) {
    return text.replace(MARKER, (_m, k) => refs[Number(k)] ?? _m);
}
/** Dedup repeated message contents across a chat array (e.g. a re-read file). Reversible
 * via the returned refs. Pure. */
export function dedupeMessages(messages, opts = {}) {
    const minLen = opts.minLen ?? DEFAULT_MIN_LEN;
    const indexByHash = new Map();
    const refs = [];
    let deduped = 0;
    const out = messages.map((m) => {
        if (m.content.length < minLen)
            return m;
        const h = hash(m.content);
        const seen = indexByHash.get(h);
        if (seen !== undefined) {
            deduped++;
            return { ...m, content: `⟦↺#${seen}⟧` };
        }
        indexByHash.set(h, refs.length);
        refs.push(m.content);
        return m;
    });
    return { messages: out, refs, deduped };
}
//# sourceMappingURL=dedup.js.map