import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  Portrait,
  validatePortrait,
  asChunkId,
  type PortraitJSON,
  type Chunk,
  type RelationInput,
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

export function resolvePortraitPath(option: string | undefined): string {
  return resolve(option ?? "./portrait.json");
}
