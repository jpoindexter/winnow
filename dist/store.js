import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { join } from "node:path";
// Reversible store — compression is lossy by design; this makes it lossless on demand.
// The original text is stashed under a short content hash; the caller hands the model a
// retrieval id and can read the full text back later. No database — flat files. The stash
// is gzipped on disk (node:zlib, zero new dep) — the model never reads it directly, so
// byte compression is free here; retrieve decompresses transparently and still reads any
// legacy plaintext stash. Best-effort: a stash failure never costs the compressed text.
const STORE_SUBDIR = "ccr";
const ID_LEN = 10;
/** Resolve the store root: explicit arg → WINNOW_DIR env → `.winnow`. */
export function resolveStoreDir(dir, env = process.env) {
    return dir ?? env.WINNOW_DIR ?? ".winnow";
}
function ccrDir(dir) {
    return join(dir, STORE_SUBDIR);
}
/** Short, stable content id (sha256 prefix). Pure. */
export function contentId(text) {
    return createHash("sha256").update(text).digest("hex").slice(0, ID_LEN);
}
/**
 * Stash the original text under its content id. Idempotent (same content → same id →
 * same file). Returns the id. Best-effort: a write failure is non-fatal.
 */
export async function stashOriginal(text, dir) {
    const id = contentId(text);
    const root = ccrDir(resolveStoreDir(dir));
    await mkdir(root, { recursive: true });
    const path = join(root, `${id}.txt.gz`);
    // Idempotent: same content → same id → same file. Skip if either form already exists.
    if (!existsSync(path) && !existsSync(join(root, `${id}.txt`))) {
        await writeFile(path, gzipSync(Buffer.from(text, "utf-8")));
    }
    return id;
}
/** Retrieve a stashed original by id, or null if unknown. Reads the gzipped stash, then
 * falls back to a legacy plaintext stash. */
export async function retrieve(id, dir) {
    if (!/^[a-f0-9]{1,64}$/.test(id))
        return null; // ids are hex only
    const root = ccrDir(resolveStoreDir(dir));
    const gz = join(root, `${id}.txt.gz`);
    if (existsSync(gz))
        return gunzipSync(await readFile(gz)).toString("utf-8");
    const legacy = join(root, `${id}.txt`);
    if (existsSync(legacy))
        return readFile(legacy, "utf-8");
    return null;
}
//# sourceMappingURL=store.js.map