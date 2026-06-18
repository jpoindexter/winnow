// TOON-style tabular transcoding. An array of similar objects pays for its keys on
// EVERY row in JSON (`{"id":1,"name":"a"},{"id":2,"name":"b"},…`). A table pays for the
// keys once: a header row + one delimited line per record. Unlike the JSON crusher
// (which elides the middle), this keeps EVERY row and is fully LOSSLESS — types and
// nesting survive because each cell is JSON-encoded. Decoder round-trips exactly. Pure.

type Row = Record<string, unknown>;

const HEADER = "TOON";

/** Quote a CSV field only when it contains a comma or quote (JSON cells have no raw newlines). */
function csvCell(s: string): string {
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(fields: string[]): string {
  return fields.map(csvCell).join(",");
}

/** Parse one CSV line (RFC4180-style quoting). Pure. */
function parseCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"' && cur === "") inQuotes = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Encode one cell, minimizing overhead while staying lossless. Plain text strings are
// emitted RAW (the common case — no quotes); only values that would be MISREAD on decode
// are JSON-encoded: non-strings (number/bool/null/object/array), the empty string (else it
// collides with a missing key), strings containing a newline (would break the row), and
// strings that look like a JSON literal (e.g. "true", "42" — else decode reparses them).
function encodeCell(v: unknown): string {
  if (typeof v === "string") {
    if (v === "" || /[\n\r]/.test(v)) return JSON.stringify(v);
    try { JSON.parse(v); return JSON.stringify(v); } catch { return v; }
  }
  return JSON.stringify(v);
}

/** Decode one cell: JSON when it parses (number/bool/null/object/array/quoted-string),
 * otherwise the raw string. Inverse of encodeCell. */
function decodeCell(field: string): unknown {
  try { return JSON.parse(field); } catch { return field; }
}

/** True for a non-empty array of plain (non-array) objects — the transcodable shape. */
export function isObjectArray(v: unknown): v is Row[] {
  return Array.isArray(v) && v.length > 0 &&
    v.every((e) => e !== null && typeof e === "object" && !Array.isArray(e));
}

/** Union of keys across rows, in first-seen order. Pure. */
function unionKeys(rows: Row[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) { seen.add(k); keys.push(k); }
  return keys;
}

/**
 * Encode an array of objects as a TOON table, or null when the shape doesn't fit.
 * Keys = union across rows (first-seen order). A missing key → empty field (distinct
 * from an explicit `null`). Lossless: each cell is `JSON.stringify(value)`.
 */
export function encodeTable(rows: Row[]): string | null {
  if (!isObjectArray(rows)) return null;
  const keys = unionKeys(rows);
  const head = `${HEADER} ${rows.length}`;
  const keyRow = csvRow(keys.map((k) => encodeCell(k)));
  const dataRows = rows.map((r) => csvRow(keys.map((k) => (k in r ? encodeCell(r[k]) : ""))));
  return [head, keyRow, ...dataRows].join("\n");
}

// ── Columnar TOON (TOONC) ────────────────────────────────────────────────────
// Push past plain TOON on LOW-CARDINALITY data: a column that's identical in every
// row is stated once (constant elision); a column with few distinct values becomes a
// dictionary + per-row index; everything else stays plain. Lossless; bigger savings
// where values repeat (status/role/region columns), no win on all-unique columns.

const HEADER_COL = "TOONC";
const DICT_MAX = 16; // dictionary a column only when distinct values ≤ this

type ColumnPlan = { cols: string[]; consts: Record<string, unknown>; dicts: Record<string, unknown[]> };

/** Split columns into constant / dictionary / plain by value cardinality. Pure. */
function classifyColumns(rows: Row[], keys: string[]): ColumnPlan {
  const consts: Record<string, unknown> = {};
  const dicts: Record<string, unknown[]> = {};
  const cols: string[] = [];
  for (const k of keys) {
    const present = rows.filter((r) => k in r);
    const distinct = [...new Set(present.map((r) => JSON.stringify(r[k])))];
    if (present.length === rows.length && distinct.length === 1) {
      consts[k] = present[0]![k];
    } else if (distinct.length > 1 && distinct.length <= DICT_MAX && distinct.length < present.length) {
      dicts[k] = distinct.map((s) => JSON.parse(s));
      cols.push(k);
    } else {
      cols.push(k);
    }
  }
  return { cols, consts, dicts };
}

/** Encode an object-array as columnar TOON (TOONC), or null if the shape doesn't fit. */
export function encodeColumnar(rows: Row[]): string | null {
  if (!isObjectArray(rows)) return null;
  const { cols, consts, dicts } = classifyColumns(rows, unionKeys(rows));
  const meta = JSON.stringify({ cols, const: consts, dict: dicts });
  const dataRows = rows.map((r) => csvRow(cols.map((k) => {
    if (!(k in r)) return "";
    const dict = dicts[k];
    if (dict) return String(dict.findIndex((v) => JSON.stringify(v) === JSON.stringify(r[k])));
    return encodeCell(r[k]);
  })));
  return [`${HEADER_COL} ${rows.length}`, meta, ...dataRows].join("\n");
}

/** Decode columnar TOON (TOONC) back to the exact array of objects, or null. */
export function decodeColumnar(text: string): Row[] | null {
  const lines = text.split("\n");
  if (!lines[0]?.startsWith(`${HEADER_COL} `)) return null;
  const n = parseInt(lines[0].slice(HEADER_COL.length + 1), 10);
  if (!Number.isFinite(n) || lines.length < 2) return null;
  let meta: { cols: string[]; const: Record<string, unknown>; dict: Record<string, unknown[]> };
  try { meta = JSON.parse(lines[1]!); } catch { return null; }
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const line = lines[2 + i];
    if (line === undefined) break;
    const fields = parseCsv(line);
    const obj: Row = { ...meta.const };
    meta.cols.forEach((k, j) => {
      const f = fields[j];
      if (f === undefined || f === "") return;
      const dict = meta.dict[k];
      obj[k] = dict ? dict[Number(f)] : decodeCell(f);
    });
    rows.push(obj);
  }
  return rows;
}

/** Decode a TOON table (plain or columnar) back to the exact array of objects, or null. */
export function decodeTable(text: string): Row[] | null {
  if (text.startsWith(`${HEADER_COL} `)) return decodeColumnar(text);
  const lines = text.split("\n");
  if (!lines[0]?.startsWith(`${HEADER} `)) return null;
  const n = parseInt(lines[0].slice(HEADER.length + 1), 10);
  if (!Number.isFinite(n) || lines.length < 2) return null;
  const keys = parseCsv(lines[1]!).map((c) => decodeCell(c) as string);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const line = lines[2 + i];
    if (line === undefined) break;
    const fields = parseCsv(line);
    const obj: Row = {};
    keys.forEach((k, j) => { if (fields[j] !== undefined && fields[j] !== "") obj[k] = decodeCell(fields[j]!); });
    rows.push(obj);
  }
  return rows;
}

/**
 * Transcode a JSON object-array string to a TOON table, else null. Lossless and keeps
 * every row. With `{dictionary:true}`, also tries columnar (TOONC) encoding and returns
 * whichever is smaller — a bigger win on low-cardinality data, at some readability cost
 * (the model resolves dictionary indices via the header), so it's opt-in.
 */
export function toonCompress(jsonText: string, opts: { dictionary?: boolean } = {}): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!isObjectArray(parsed)) return null;
  let best = encodeTable(parsed);
  if (opts.dictionary) {
    const col = encodeColumnar(parsed);
    if (col && (!best || col.length < best.length)) best = col;
  }
  if (!best || best.length >= jsonText.length) return null;
  return best;
}
