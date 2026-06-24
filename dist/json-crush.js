import { DEFAULTS } from "./types.js";
// JSON crusher — the high-value win. Fat tool outputs are usually arrays of similar
// objects (search results, file lists, API rows). Keep a head + tail sample, elide the
// middle with a count, and truncate runaway string values. Pure, recursive,
// depth-bounded. Lossy by design — the original is recoverable from the store.
const MAX_DEPTH = 6;
/** Truncate a long string with a char-count marker. Pure. */
function crushString(s, max) {
    if (s.length <= max)
        return s;
    return `${s.slice(0, max)}…(+${s.length - max} chars)`;
}
/** True for an array whose elements are all plain objects (the crushable shape). */
function isObjectArray(v) {
    return (Array.isArray(v) &&
        v.length > 0 &&
        v.every((e) => e !== null && typeof e === "object" && !Array.isArray(e)));
}
function crushValue(v, opts, depth) {
    if (typeof v === "string")
        return crushString(v, opts.maxStringLength);
    if (depth >= MAX_DEPTH)
        return v;
    if (isObjectArray(v))
        return crushObjectArray(v, opts, depth);
    if (Array.isArray(v))
        return v.map((e) => crushValue(e, opts, depth + 1));
    if (v !== null && typeof v === "object") {
        const out = {};
        for (const [k, val] of Object.entries(v))
            out[k] = crushValue(val, opts, depth + 1);
        return out;
    }
    return v;
}
/** Keep head+tail items; replace the middle with an elision marker carrying the union
 * of keys seen across the elided rows (so heterogeneous arrays don't lose schema). */
function crushObjectArray(arr, opts, depth) {
    const keep = opts.headItems + opts.tailItems;
    if (arr.length <= keep + 1)
        return arr.map((e) => crushValue(e, opts, depth + 1));
    const head = arr.slice(0, opts.headItems).map((e) => crushValue(e, opts, depth + 1));
    const tail = arr.slice(arr.length - opts.tailItems).map((e) => crushValue(e, opts, depth + 1));
    const elidedRows = arr.slice(opts.headItems, arr.length - opts.tailItems);
    const keys = new Set();
    for (const row of elidedRows)
        for (const k of Object.keys(row))
            keys.add(k);
    return [...head, { __elided__: elidedRows.length, sample_keys: [...keys] }, ...tail];
}
/**
 * Compress a JSON string into re-serialized crushed JSON, or return the original
 * unchanged when it doesn't parse (the router then falls back to log/text). Pure.
 */
export function crushJson(raw, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return raw;
    }
    return JSON.stringify(crushValue(parsed, opts, 0), null, 2);
}
//# sourceMappingURL=json-crush.js.map