import { copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
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

/** Default when `--portrait` is omitted; resolved relative to `process.cwd()`. */
export const DEFAULT_CLI_PORTRAIT = "./portrait.json";

/**
 * Older `athanor init` wrote `./portrait/portrait.json` (default `--output ./portrait`).
 * `validate` / read-only commands use `./portrait.json` by default — if that file is missing,
 * fall back to the legacy path so users are not shown another portrait (e.g. workspace example).
 */
export const LEGACY_INIT_PORTRAIT_RELATIVE = "portrait/portrait.json";

/**
 * Resolve portrait for read-only commands (`validate`, etc.) when `--portrait` is omitted or default.
 *
 * - Tries `./portrait.json` and legacy `./portrait/portrait.json` (older init default `--output ./portrait`).
 * - If **both** exist (common in monorepo dev: stray `portrait.json` + fresh init), pick the **newer** file
 *   so a recent `init` into `portrait/` is not shadowed by an old flat `portrait.json`.
 */
export function resolvePortraitPathForReadCommand(
  portrait: string | undefined,
): string {
  const primary = resolvePortraitPath(portrait);
  const useDefaultPath =
    portrait === undefined ||
    portrait === DEFAULT_CLI_PORTRAIT ||
    portrait === "./portrait.json";

  if (!useDefaultPath) {
    return primary;
  }

  const legacy = resolve(process.cwd(), LEGACY_INIT_PORTRAIT_RELATIVE);
  const primaryExists = existsSync(primary);
  const legacyExists = existsSync(legacy);

  if (primaryExists && legacyExists) {
    try {
      const tPrimary = statSync(primary).mtimeMs;
      const tLegacy = statSync(legacy).mtimeMs;
      return tLegacy >= tPrimary ? legacy : primary;
    } catch {
      return primary;
    }
  }
  if (primaryExists) return primary;
  if (legacyExists) return legacy;
  return primary;
}

/**
 * Example portrait shipped in the repo (path relative to workspace root).
 * Used when the default `./portrait.json` is missing and the user did not pass `--portrait`.
 */
export const WORKSPACE_EXAMPLE_PORTRAIT_RELATIVE =
  "examples/portraits/fictional-cto/portrait.json";

export function resolvePortraitPath(option: string | undefined): string {
  return resolve(option ?? DEFAULT_CLI_PORTRAIT);
}

function findWorkspaceExamplePortraitPath(): string | undefined {
  let dir = process.cwd();
  for (let i = 0; i < 16; i++) {
    const candidate = resolve(dir, WORKSPACE_EXAMPLE_PORTRAIT_RELATIVE);
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/**
 * Resolves the portrait file like {@link resolvePortraitPath}.
 * When the file is missing and `allowWorkspaceExampleFallback` is true, walks up from
 * `process.cwd()` to find {@link WORKSPACE_EXAMPLE_PORTRAIT_RELATIVE} (so `pnpm --filter`
 * runs from `apps/cli` still pick up the repo example).
 */
export function resolvePortraitPathWithWorkspaceFallback(
  portrait: string | undefined,
  opts: { allowWorkspaceExampleFallback: boolean },
): string {
  const primary = resolvePortraitPath(portrait);
  if (existsSync(primary)) return primary;
  if (!opts.allowWorkspaceExampleFallback) return primary;
  const example = findWorkspaceExamplePortraitPath();
  if (example) return example;
  return primary;
}

/**
 * Like {@link resolvePortraitPathWithWorkspaceFallback}, but for commands that **write** the
 * portrait file: if we would load the **bundled repo example** (default `--portrait` missing
 * and no `./portrait.json` in cwd), **copy** the example to `./portrait.json` in cwd first
 * so we never mutate `examples/portraits/...` in the tree.
 */
export async function resolvePortraitPathForMutatingCommand(
  portrait: string | undefined,
  opts: { allowWorkspaceExampleFallback: boolean },
): Promise<string> {
  const resolved = resolvePortraitPathWithWorkspaceFallback(portrait, opts);
  if (!existsSync(resolved)) {
    throw new Error(`Portrait not found: ${resolved}`);
  }
  const example = findWorkspaceExamplePortraitPath();
  if (
    !opts.allowWorkspaceExampleFallback ||
    !example ||
    resolve(resolved) !== resolve(example)
  ) {
    return resolved;
  }
  const localPath = resolve(process.cwd(), "portrait.json");
  if (!existsSync(localPath)) {
    await copyFile(example, localPath);
  }
  return localPath;
}
