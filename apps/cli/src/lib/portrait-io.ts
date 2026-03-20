import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Portrait,
  asChunkId,
  type PortraitJSON,
} from "@athanor/core";

export async function loadPortraitJSON(path: string): Promise<PortraitJSON> {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    throw new Error(`Portrait file not found: ${resolved}`);
  }
  const raw = await readFile(resolved, "utf-8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${resolved}`);
  }
  return data as PortraitJSON;
}

export function jsonToPortrait(json: PortraitJSON): Portrait {
  const portrait = new Portrait({ name: json.subject.name, id: json.subject.id });

  // We need to reconstruct the portrait by adding chunks
  // Since Portrait auto-generates IDs, we need to use the chunks directly.
  // We'll add chunks and then map old IDs to new IDs... but actually
  // the Portrait class generates its own IDs. For import/validation purposes,
  // we should work with the raw JSON and the validator.
  // For operations that need a Portrait instance (export), we rebuild it.

  const idMap = new Map<string, string>();

  for (const chunk of json.chunks) {
    const added = portrait.addChunk({
      author: chunk.author,
      cluster: chunk.cluster,
      type: chunk.type,
      uniqueness: chunk.uniqueness,
      source: chunk.source,
      confidence: chunk.confidence,
      context_tags: chunk.context_tags,
      linked_chunks: chunk.linked_chunks,
      content: chunk.content,
    });
    idMap.set(chunk.chunk_id, added.chunk_id);
  }

  for (const rel of json.relations) {
    const mappedSource = idMap.get(rel.source) ?? rel.source;
    const mappedTarget = idMap.get(rel.target) ?? rel.target;
    try {
      portrait.addRelation({
        source: asChunkId(mappedSource),
        target: asChunkId(mappedTarget),
        type: rel.type,
        description: rel.description,
      });
    } catch {
      // Skip relations referencing missing chunks
    }
  }

  return portrait;
}

export async function savePortraitJSON(path: string, data: PortraitJSON): Promise<void> {
  const resolved = resolve(path);
  await writeFile(resolved, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/** Default portrait path when none is passed (current working directory). */
export const DEFAULT_PORTRAIT_FILE = "./portrait.json";

/** Example portrait shipped in the repo (for dev / demos when `./portrait.json` is missing). */
export const EXAMPLE_PORTRAIT_RELATIVE = "examples/portraits/fictional-cto/portrait.json";

export type ResolvePortraitOptions = {
  /**
   * When `./portrait.json` is missing, try the fictional CTO example (cwd, then bundled path).
   * Disable for commands that write or merge into the portrait file.
   * @default true
   */
  fallbackToExample?: boolean;
};

function bundledExamplePortraitPath(): string {
  return join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    "..",
    EXAMPLE_PORTRAIT_RELATIVE,
  );
}

function isDefaultPortraitLocation(option: string | undefined): boolean {
  if (option === undefined) return true;
  return resolve(option) === resolve(DEFAULT_PORTRAIT_FILE);
}

/**
 * Resolve a portrait JSON path. When the default `./portrait.json` is missing and
 * `fallbackToExample` is true, falls back to `examples/portraits/fictional-cto/portrait.json`
 * (from cwd, then next to the CLI package in the monorepo).
 */
export function resolvePortraitPath(
  option: string | undefined,
  options: ResolvePortraitOptions = {},
): string {
  const { fallbackToExample = true } = options;
  const input = option ?? DEFAULT_PORTRAIT_FILE;
  const resolved = resolve(input);

  if (existsSync(resolved)) {
    return resolved;
  }

  if (!fallbackToExample || !isDefaultPortraitLocation(option)) {
    throw new Error(`Portrait file not found: ${resolved}`);
  }

  const fromCwd = resolve(process.cwd(), EXAMPLE_PORTRAIT_RELATIVE);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }

  const bundled = bundledExamplePortraitPath();
  if (existsSync(bundled)) {
    return bundled;
  }

  throw new Error(
    `Portrait file not found: ${resolved}\n` +
      `  Also tried example: ${fromCwd}\n` +
      `  Create ${DEFAULT_PORTRAIT_FILE}, copy from ${EXAMPLE_PORTRAIT_RELATIVE}, or pass --portrait <path>.`,
  );
}
