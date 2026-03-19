import {
  createGraphStore,
  type PortraitJSON,
  type Chunk,
  type Relation,
} from "@athanor/core";
import type { CloneApiConfig } from "./config.js";
import type { PortraitStore } from "./portrait-store.js";

function isLocalLibsql(url: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  return (
    u.startsWith("file:") ||
    u.startsWith("sqlite:") ||
    u.startsWith("libsql:")
  );
}

function portraitJsonFromGraphExport(
  subjectId: string,
  displayName: string,
  raw: { chunks: unknown[]; relations: unknown[] },
): PortraitJSON {
  const chunks = raw.chunks as Chunk[];
  const relations = raw.relations as Relation[];
  const cluster_coverage: Record<string, number> = {};
  for (const c of chunks) {
    cluster_coverage[c.cluster] = (cluster_coverage[c.cluster] ?? 0) + 1;
  }
  return {
    version: "1.0.0-draft",
    subject: { id: subjectId, name: displayName },
    created_at: new Date().toISOString(),
    chunks,
    relations,
    metadata: {
      completeness_score: 0,
      chunk_count: chunks.length,
      relation_count: relations.length,
      cluster_coverage,
    },
  };
}

/**
 * Load portrait data: JSON file, or SQLite (`file:` / `libsql:`) when `PORTRAIT_ID` is set.
 */
export async function loadPortraitIntoStore(
  store: PortraitStore,
  config: CloneApiConfig,
): Promise<void> {
  if (config.portraitPath) {
    await store.loadFromFile(config.portraitPath);
    return;
  }

  if (!config.portraitId || !isLocalLibsql(config.databaseUrl)) {
    return;
  }

  const graph = createGraphStore(config.databaseUrl);
  await graph.connect();
  try {
    const raw = await graph.exportPortrait(config.portraitId);
    const displayName =
      config.portraitSubjectName ?? config.portraitId;
    store.loadFromJSON(
      portraitJsonFromGraphExport(config.portraitId, displayName, raw),
    );
  } finally {
    await graph.close();
  }
}
