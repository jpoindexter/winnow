type Row = Record<string, unknown>;
/** True for a non-empty array of plain (non-array) objects — the transcodable shape. */
export declare function isObjectArray(v: unknown): v is Row[];
/**
 * Encode an array of objects as a TOON table, or null when the shape doesn't fit.
 * Keys = union across rows (first-seen order). A missing key → empty field (distinct
 * from an explicit `null`). Lossless: each cell is `JSON.stringify(value)`.
 */
export declare function encodeTable(rows: Row[]): string | null;
/** Encode an object-array as columnar TOON (TOONC), or null if the shape doesn't fit. */
export declare function encodeColumnar(rows: Row[]): string | null;
/** Decode columnar TOON (TOONC) back to the exact array of objects, or null. */
export declare function decodeColumnar(text: string): Row[] | null;
/** Decode a TOON table (plain or columnar) back to the exact array of objects, or null. */
export declare function decodeTable(text: string): Row[] | null;
/**
 * Transcode a JSON object-array string to a TOON table, else null. Lossless and keeps
 * every row. With `{dictionary:true}`, also tries columnar (TOONC) encoding and returns
 * whichever is smaller — a bigger win on low-cardinality data, at some readability cost
 * (the model resolves dictionary indices via the header), so it's opt-in.
 */
export declare function toonCompress(jsonText: string, opts?: {
    dictionary?: boolean;
}): string | null;
export {};
