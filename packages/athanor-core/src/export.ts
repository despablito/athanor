import type { Portrait } from "./portrait.js";
import type { Chunk } from "./types.js";
import { CHUNK_TYPE_CODES } from "./types.js";

export function toJSON(portrait: Portrait): string {
  return JSON.stringify(portrait.toJSON(), null, 2);
}

export function toCypher(portrait: Portrait): string {
  const json = portrait.toJSON();
  const lines: string[] = [];

  lines.push("// Athanor Portrait Cypher Export");
  lines.push(`// Subject: ${json.subject.name} (${json.subject.id})`);
  lines.push(`// Generated: ${json.created_at}`);
  lines.push("");

  // Create chunk nodes
  for (const chunk of json.chunks) {
    const props = cypherProps({
      chunk_id: chunk.chunk_id,
      author: chunk.author,
      cluster: chunk.cluster,
      type: chunk.type,
      uniqueness: chunk.uniqueness,
      source: chunk.source,
      confidence: chunk.confidence,
      content: chunk.content,
    });
    lines.push(`CREATE (:Chunk ${props});`);
  }

  lines.push("");

  // Create relation edges
  for (const rel of json.relations) {
    const props = rel.description
      ? ` ${cypherProps({ description: rel.description })}`
      : "";
    lines.push(
      `MATCH (a:Chunk {chunk_id: '${rel.source}'}), (b:Chunk {chunk_id: '${rel.target}'})`,
    );
    lines.push(`CREATE (a)-[:${rel.type}${props}]->(b);`);
  }

  return lines.join("\n");
}

function cypherProps(obj: Record<string, unknown>): string {
  const pairs = Object.entries(obj).map(([k, v]) => {
    if (typeof v === "string") return `${k}: '${escapeCypher(v)}'`;
    return `${k}: ${v}`;
  });
  return `{${pairs.join(", ")}}`;
}

function escapeCypher(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function toMarkdown(portrait: Portrait): string {
  const json = portrait.toJSON();
  const lines: string[] = [];

  lines.push(`# Portrait: ${json.subject.name}`);
  lines.push("");
  lines.push(`**Subject ID:** ${json.subject.id}`);
  lines.push(`**Protocol Version:** ${json.version}`);
  lines.push(`**Generated:** ${json.created_at}`);
  lines.push(
    `**Completeness:** ${(json.metadata.completeness_score * 100).toFixed(0)}%`,
  );
  lines.push(
    `**Chunks:** ${json.metadata.chunk_count} | **Relations:** ${json.metadata.relation_count}`,
  );
  lines.push("");

  // Group chunks by cluster
  const clusters = groupByCluster(json.chunks);
  for (const [cluster, chunks] of Object.entries(clusters)) {
    lines.push(`## ${formatClusterName(cluster)}`);
    lines.push("");

    for (const chunk of chunks) {
      const typeCode = CHUNK_TYPE_CODES[chunk.type] ?? chunk.type;
      lines.push(
        `### ${chunk.chunk_id} [${typeCode}] — ${chunk.uniqueness} (${(chunk.confidence * 100).toFixed(0)}%)`,
      );
      lines.push("");
      lines.push(chunk.content);
      lines.push("");

      if (chunk.context_tags.length > 0) {
        lines.push(`*Tags: ${chunk.context_tags.join(", ")}*`);
        lines.push("");
      }

      // List relations for this chunk
      const rels = json.relations.filter(
        (r) => r.source === chunk.chunk_id || r.target === chunk.chunk_id,
      );
      if (rels.length > 0) {
        lines.push("**Relations:**");
        for (const rel of rels) {
          const direction =
            rel.source === chunk.chunk_id
              ? `→ ${rel.target}`
              : `← ${rel.source}`;
          lines.push(`- ${rel.type} ${direction}`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

export function toObsidian(portrait: Portrait): Map<string, string> {
  const json = portrait.toJSON();
  const files = new Map<string, string>();

  // Index file
  const indexLines: string[] = [];
  indexLines.push(`# ${json.subject.name}`);
  indexLines.push("");
  indexLines.push("## Clusters");
  indexLines.push("");
  const clusters = groupByCluster(json.chunks);
  for (const cluster of Object.keys(clusters)) {
    indexLines.push(`- [[${formatClusterName(cluster)}]]`);
  }
  indexLines.push("");
  indexLines.push("## Stats");
  indexLines.push("");
  indexLines.push(`- Chunks: ${json.metadata.chunk_count}`);
  indexLines.push(`- Relations: ${json.metadata.relation_count}`);
  indexLines.push(
    `- Completeness: ${(json.metadata.completeness_score * 100).toFixed(0)}%`,
  );
  files.set("Index.md", indexLines.join("\n"));

  // One file per chunk
  for (const chunk of json.chunks) {
    const chunkLines: string[] = [];
    const typeCode = CHUNK_TYPE_CODES[chunk.type] ?? chunk.type;

    chunkLines.push("---");
    chunkLines.push(`chunk_id: ${chunk.chunk_id}`);
    chunkLines.push(`type: ${chunk.type}`);
    chunkLines.push(`cluster: ${chunk.cluster}`);
    chunkLines.push(`uniqueness: ${chunk.uniqueness}`);
    chunkLines.push(`confidence: ${chunk.confidence}`);
    chunkLines.push(`source: ${chunk.source}`);
    if (chunk.context_tags.length > 0) {
      chunkLines.push(`tags: [${chunk.context_tags.join(", ")}]`);
    }
    chunkLines.push("---");
    chunkLines.push("");
    chunkLines.push(`# ${chunk.chunk_id} [${typeCode}]`);
    chunkLines.push("");
    chunkLines.push(chunk.content);
    chunkLines.push("");

    // Outgoing relations
    const rels = json.relations.filter(
      (r) => r.source === chunk.chunk_id || r.target === chunk.chunk_id,
    );
    if (rels.length > 0) {
      chunkLines.push("## Relations");
      chunkLines.push("");
      for (const rel of rels) {
        const other =
          rel.source === chunk.chunk_id ? rel.target : rel.source;
        const direction = rel.source === chunk.chunk_id ? "→" : "←";
        chunkLines.push(`- ${rel.type} ${direction} [[${other}]]`);
        if (rel.description) {
          chunkLines.push(`  - ${rel.description}`);
        }
      }
    }

    files.set(`${chunk.chunk_id}.md`, chunkLines.join("\n"));
  }

  return files;
}

function groupByCluster(chunks: Chunk[]): Record<string, Chunk[]> {
  const map: Record<string, Chunk[]> = {};
  for (const chunk of chunks) {
    if (!map[chunk.cluster]) map[chunk.cluster] = [];
    map[chunk.cluster].push(chunk);
  }
  return map;
}

function formatClusterName(cluster: string): string {
  return cluster
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
