import { Command } from "commander";
import chalk from "chalk";
import type { PortraitJSON, Chunk, Relation } from "@athanor/core";
import { loadPortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { heading, dim, errorBox } from "../lib/ui.js";

interface StatsOpts {
  portrait: string;
  centrality: boolean;
  tensions: boolean;
  learningChains: boolean;
}

export const statsCommand = new Command("stats")
  .description("Display portrait statistics")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--centrality", "Show top 10 most connected chunks", false)
  .option("--tensions", "Show all CONTRASTS_WITH pairs", false)
  .option("--learning-chains", "Show LEARNED_FROM sequences", false)
  .action(async (opts: StatsOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait);

    try {
      const portrait = await loadPortraitJSON(portraitPath);

      console.log("");
      console.log(`  ${heading("Portrait Stats")}`);
      console.log(`  ${dim(portrait.subject.name)} ${dim(`(${portrait.subject.id})`)}`);
      console.log("");

      printBasicStats(portrait);

      if (opts.centrality) {
        console.log("");
        printCentrality(portrait);
      }
      if (opts.tensions) {
        console.log("");
        printTensions(portrait);
      }
      if (opts.learningChains) {
        console.log("");
        printLearningChains(portrait);
      }

      console.log("");
    } catch (err) {
      errorBox(
        err instanceof Error ? err.message : String(err),
        "Check that the portrait file exists and contains valid JSON.",
      );
      process.exit(1);
    }
  });

function printBasicStats(portrait: PortraitJSON): void {
  // Clusters
  const clusters = portrait.metadata.cluster_coverage;
  const sortedClusters = Object.entries(clusters).sort(([, a], [, b]) => b - a);

  console.log(`  ${chalk.bold("Chunks by cluster:")}`);
  for (const [cluster, count] of sortedClusters) {
    const bar = chalk.cyan("█".repeat(Math.min(count, 30)));
    console.log(`    ${cluster.padEnd(30)} ${bar} ${count}`);
  }

  // Types
  const types: Record<string, number> = {};
  for (const c of portrait.chunks) {
    types[c.type] = (types[c.type] ?? 0) + 1;
  }
  const sortedTypes = Object.entries(types).sort(([, a], [, b]) => b - a);

  console.log("");
  console.log(`  ${chalk.bold("Chunks by type:")}`);
  for (const [type, count] of sortedTypes) {
    const bar = chalk.magenta("█".repeat(Math.min(count, 30)));
    console.log(`    ${type.padEnd(20)} ${bar} ${count}`);
  }

  // Uniqueness
  const uniqueness: Record<string, number> = {};
  for (const c of portrait.chunks) {
    uniqueness[c.uniqueness] = (uniqueness[c.uniqueness] ?? 0) + 1;
  }

  console.log("");
  console.log(`  ${chalk.bold("Chunks by uniqueness:")}`);
  for (const level of ["CRITICAL", "HIGH", "MEDIUM"]) {
    const count = uniqueness[level] ?? 0;
    const pct = portrait.chunks.length > 0 ? ((count / portrait.chunks.length) * 100).toFixed(0) : "0";
    const bar = level === "CRITICAL" ? chalk.red("█") : level === "HIGH" ? chalk.yellow("█") : chalk.green("█");
    console.log(`    ${level.padEnd(12)} ${bar.repeat(Math.min(count, 30))} ${count} (${pct}%)`);
  }

  // Relations
  const relTypes: Record<string, number> = {};
  for (const r of portrait.relations) {
    relTypes[r.type] = (relTypes[r.type] ?? 0) + 1;
  }
  const sortedRelTypes = Object.entries(relTypes).sort(([, a], [, b]) => b - a);

  console.log("");
  console.log(`  ${chalk.bold("Relations by type:")}`);
  for (const [type, count] of sortedRelTypes) {
    const bar = chalk.blue("█".repeat(Math.min(count, 30)));
    console.log(`    ${type.padEnd(22)} ${bar} ${count}`);
  }

  // Summary
  console.log("");
  console.log(`  ${chalk.bold("Summary:")}`);
  console.log(`    Total chunks:     ${chalk.bold(portrait.chunks.length.toString())}`);
  console.log(`    Total relations:  ${chalk.bold(portrait.relations.length.toString())}`);
  console.log(`    Clusters:         ${chalk.bold(Object.keys(clusters).length.toString())}`);

  const avgConfidence =
    portrait.chunks.length > 0
      ? portrait.chunks.reduce((sum, c) => sum + c.confidence, 0) / portrait.chunks.length
      : 0;
  console.log(`    Avg confidence:   ${chalk.bold(avgConfidence.toFixed(2))}`);
  console.log(`    Completeness:     ${chalk.bold(portrait.metadata.completeness_score.toFixed(2))}`);
}

function printCentrality(portrait: PortraitJSON): void {
  console.log(`  ${heading("Top 10 Most Connected Chunks")}`);
  console.log("");

  const connectionCount = new Map<string, number>();
  for (const chunk of portrait.chunks) {
    connectionCount.set(chunk.chunk_id, 0);
  }
  for (const rel of portrait.relations) {
    connectionCount.set(rel.source, (connectionCount.get(rel.source) ?? 0) + 1);
    connectionCount.set(rel.target, (connectionCount.get(rel.target) ?? 0) + 1);
  }

  const sorted = [...connectionCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id as string, c]));

  for (const [id, count] of sorted) {
    const chunk = chunkMap.get(id);
    const cluster = chunk ? dim(`(${chunk.cluster})`) : "";
    const bar = chalk.cyan("█".repeat(Math.min(count, 20)));
    console.log(`    ${id.padEnd(16)} ${bar} ${count} ${cluster}`);
  }
}

function printTensions(portrait: PortraitJSON): void {
  console.log(`  ${heading("Tensions (CONTRASTS_WITH)")}`);
  console.log("");

  const tensions = portrait.relations.filter((r) => r.type === "CONTRASTS_WITH");
  if (tensions.length === 0) {
    console.log(`    ${dim("No tensions found.")}`);
    return;
  }

  const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id as string, c]));

  for (const t of tensions) {
    const src = chunkMap.get(t.source);
    const tgt = chunkMap.get(t.target);
    const srcLabel = src ? `${t.source} ${dim(`(${src.cluster})`)}` : t.source;
    const tgtLabel = tgt ? `${t.target} ${dim(`(${tgt.cluster})`)}` : t.target;
    console.log(`    ${chalk.red("⚡")} ${srcLabel} ${chalk.red("↔")} ${tgtLabel}`);
    if (t.description) {
      console.log(`      ${dim(t.description)}`);
    }
  }
}

function printLearningChains(portrait: PortraitJSON): void {
  console.log(`  ${heading("Learning Chains (LEARNED_FROM)")}`);
  console.log("");

  const learnedFrom = portrait.relations.filter((r) => r.type === "LEARNED_FROM");
  if (learnedFrom.length === 0) {
    console.log(`    ${dim("No learning chains found.")}`);
    return;
  }

  // Build adjacency for LEARNED_FROM: source learned from target
  const adj = new Map<string, string[]>();
  const hasIncoming = new Set<string>();

  for (const r of learnedFrom) {
    if (!adj.has(r.target)) adj.set(r.target, []);
    adj.get(r.target)!.push(r.source);
    hasIncoming.add(r.source);
  }

  // Roots are nodes that appear as targets but not as incoming (sources)
  const roots = [...adj.keys()].filter((k) => !hasIncoming.has(k));
  const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id as string, c]));
  const visited = new Set<string>();

  function printChain(id: string, depth: number): void {
    if (visited.has(id)) return;
    visited.add(id);
    const chunk = chunkMap.get(id);
    const label = chunk ? dim(`(${chunk.cluster}, ${chunk.type})`) : "";
    const indent = "  ".repeat(depth);
    const arrow = depth > 0 ? chalk.green("→ ") : "";
    console.log(`    ${indent}${arrow}${chalk.bold(id)} ${label}`);

    const children = adj.get(id) ?? [];
    for (const child of children) {
      printChain(child, depth + 1);
    }
  }

  for (const root of roots) {
    printChain(root, 0);
    console.log("");
  }

  // Handle chains with no clear root (cycles or isolated pairs)
  for (const [target, sources] of adj) {
    if (!visited.has(target)) {
      printChain(target, 0);
      console.log("");
    }
  }
}
