import { existsSync } from "node:fs";
import {
  createGraphStore,
  type PortraitJSON,
  type Chunk,
  type Relation,
} from "@athanor/core";
import { PortraitStore } from "@athanor/clone-api";
import { resolvePortraitPath } from "./portrait-io.js";

export const DEFAULT_CLONE_CONNECTION = "file:./portrait.db";

export function portraitJsonFromGraphExport(
  subjectId: string,
  displayName: string,
  raw: { chunks: unknown[]; relations: unknown[] },
): PortraitJSON {
  const chunks = raw.chunks as unknown as Chunk[];
  const relations = raw.relations as unknown as Relation[];
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

export async function loadPortraitIntoStore(opts: {
  portrait: string;
  connection: string;
  subject?: string;
  subjectName?: string;
}): Promise<PortraitStore> {
  const store = new PortraitStore();

  if (opts.subject) {
    const graph = createGraphStore(opts.connection);
    await graph.connect();
    try {
      const raw = await graph.exportPortrait(opts.subject);
      const displayName = opts.subjectName ?? opts.subject;
      store.loadFromJSON(
        portraitJsonFromGraphExport(opts.subject, displayName, raw),
      );
    } finally {
      await graph.close();
    }
    return store;
  }

  const path = resolvePortraitPath(opts.portrait);
  if (!existsSync(path)) {
    throw new Error(
      `Portrait not found: ${path}\n` +
        `  Push a portrait with: athanor db push --portrait ./portrait.json\n` +
        `  Or load from the graph DB: athanor chat --subject <id> --connection ${DEFAULT_CLONE_CONNECTION}`,
    );
  }
  await store.loadFromFile(path);
  return store;
}
