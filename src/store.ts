import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Reversible store — compression is lossy by design; this makes it lossless on demand.
// The original text is stashed under a short content hash; the caller hands the model a
// retrieval id and can read the full text back later. No database — flat files. All
// local. Best-effort writes: a stash failure never costs the caller the compressed text.

const STORE_SUBDIR = "ccr";
const ID_LEN = 10;

/** Resolve the store root: explicit arg → WINNOW_DIR env → `.winnow`. */
export function resolveStoreDir(dir?: string, env: NodeJS.ProcessEnv = process.env): string {
  return dir ?? env.WINNOW_DIR ?? ".winnow";
}

function ccrDir(dir: string): string {
  return join(dir, STORE_SUBDIR);
}

/** Short, stable content id (sha256 prefix). Pure. */
export function contentId(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, ID_LEN);
}

/**
 * Stash the original text under its content id. Idempotent (same content → same id →
 * same file). Returns the id. Best-effort: a write failure is non-fatal.
 */
export async function stashOriginal(text: string, dir?: string): Promise<string> {
  const id = contentId(text);
  const root = ccrDir(resolveStoreDir(dir));
  await mkdir(root, { recursive: true });
  const path = join(root, `${id}.txt`);
  if (!existsSync(path)) await writeFile(path, text, "utf-8");
  return id;
}

/** Retrieve a stashed original by id, or null if unknown. */
export async function retrieve(id: string, dir?: string): Promise<string | null> {
  if (!/^[a-f0-9]{1,64}$/.test(id)) return null; // ids are hex only
  const path = join(ccrDir(resolveStoreDir(dir)), `${id}.txt`);
  if (!existsSync(path)) return null;
  return readFile(path, "utf-8");
}
