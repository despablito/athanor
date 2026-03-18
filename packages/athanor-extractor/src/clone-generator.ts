import type { PortraitJSON } from "@athanor/core";
import type { LLMProvider } from "./provider.js";
import { loadPrompt } from "./prompts.js";

export async function generateClonePrompt(
  provider: LLMProvider,
  portrait: PortraitJSON,
): Promise<string> {
  const systemPrompt = await loadPrompt("clone-synthesis");
  const portraitSummary = buildPortraitSummary(portrait);
  const response = await provider.complete(systemPrompt, portraitSummary);

  // The response is the system prompt itself — clean it up
  return response.trim();
}

function buildPortraitSummary(portrait: PortraitJSON): string {
  const lines: string[] = [];

  lines.push(`# Portrait: ${portrait.subject.name} (${portrait.subject.id})`);
  lines.push(`Completeness: ${(portrait.metadata.completeness_score * 100).toFixed(0)}%`);
  lines.push(`Chunks: ${portrait.metadata.chunk_count}, Relations: ${portrait.metadata.relation_count}`);
  lines.push("");

  // Group chunks by type for structured presentation
  const byType = new Map<string, typeof portrait.chunks>();
  for (const chunk of portrait.chunks) {
    if (!byType.has(chunk.type)) byType.set(chunk.type, []);
    byType.get(chunk.type)!.push(chunk);
  }

  // Critical chunks first
  const criticalChunks = portrait.chunks.filter((c) => c.uniqueness === "CRITICAL");
  if (criticalChunks.length > 0) {
    lines.push("## CRITICAL Identity Chunks");
    for (const chunk of criticalChunks) {
      lines.push(`### ${chunk.chunk_id} [${chunk.cluster}/${chunk.type}] (confidence: ${chunk.confidence})`);
      lines.push(chunk.content);
      lines.push("");
    }
  }

  // Style chunks
  const styles = byType.get("style") ?? [];
  if (styles.length > 0) {
    lines.push("## Communication Style");
    for (const s of styles) {
      lines.push(`- [${s.chunk_id}] ${s.content}`);
    }
    lines.push("");
  }

  // Beliefs
  const beliefs = byType.get("belief") ?? [];
  if (beliefs.length > 0) {
    lines.push("## Core Beliefs");
    for (const b of beliefs) {
      lines.push(`- [${b.chunk_id}] (${b.uniqueness}, conf: ${b.confidence}) ${b.content}`);
    }
    lines.push("");
  }

  // Heuristics
  const heuristics = byType.get("heuristic") ?? [];
  if (heuristics.length > 0) {
    lines.push("## Decision Heuristics");
    for (const h of heuristics) {
      lines.push(`- [${h.chunk_id}] (${h.uniqueness}) ${h.content}`);
    }
    lines.push("");
  }

  // Anti-patterns
  const antiPatterns = byType.get("anti-pattern") ?? [];
  if (antiPatterns.length > 0) {
    lines.push("## Anti-Patterns (Things to NEVER do)");
    for (const a of antiPatterns) {
      lines.push(`- [${a.chunk_id}] ${a.content}`);
    }
    lines.push("");
  }

  // Frameworks
  const frameworks = byType.get("framework") ?? [];
  if (frameworks.length > 0) {
    lines.push("## Mental Frameworks");
    for (const f of frameworks) {
      lines.push(`- [${f.chunk_id}] ${f.content}`);
    }
    lines.push("");
  }

  // Emotions
  const emotions = byType.get("emotion") ?? [];
  if (emotions.length > 0) {
    lines.push("## Emotional Responses");
    for (const e of emotions) {
      lines.push(`- [${e.chunk_id}] ${e.content}`);
    }
    lines.push("");
  }

  // Rants
  const rants = byType.get("rant") ?? [];
  if (rants.length > 0) {
    lines.push("## Rant Topics (Strong Opinions)");
    for (const r of rants) {
      lines.push(`- [${r.chunk_id}] ${r.content}`);
    }
    lines.push("");
  }

  // Stories
  const stories = byType.get("story") ?? [];
  if (stories.length > 0) {
    lines.push("## Key Stories and Anecdotes");
    for (const s of stories) {
      lines.push(`- [${s.chunk_id}] ${s.content}`);
    }
    lines.push("");
  }

  // Contradictions
  const contradictions = byType.get("contradiction") ?? [];
  const contrastRelations = portrait.relations.filter((r) => r.type === "CONTRASTS_WITH");
  if (contradictions.length > 0 || contrastRelations.length > 0) {
    lines.push("## Known Contradictions and Tensions");
    for (const c of contradictions) {
      lines.push(`- [${c.chunk_id}] ${c.content}`);
    }
    for (const r of contrastRelations) {
      lines.push(`- TENSION: ${r.source} ↔ ${r.target}: ${r.description ?? "(no description)"}`);
    }
    lines.push("");
  }

  // Remaining types
  for (const [type, chunks] of byType) {
    if (["style", "belief", "heuristic", "anti-pattern", "framework", "emotion", "rant", "story", "contradiction"].includes(type)) {
      continue;
    }
    lines.push(`## ${type.charAt(0).toUpperCase() + type.slice(1)} Chunks`);
    for (const chunk of chunks) {
      lines.push(`- [${chunk.chunk_id}] (${chunk.cluster}, ${chunk.uniqueness}) ${chunk.content}`);
    }
    lines.push("");
  }

  // Hardcoded exceptions
  const exceptions = portrait.relations.filter((r) => r.type === "HARDCODED_EXCEPTION");
  if (exceptions.length > 0) {
    lines.push("## Hardcoded Exceptions");
    for (const e of exceptions) {
      lines.push(`- ${e.source} overrides ${e.target}: ${e.description ?? "(no description)"}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
