import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { validateChunk, validateRelation, type PortraitJSON, type Chunk, type Relation } from "@athanor/core";
import { loadPortraitJSON, savePortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { ok, warn, fail, errorBox, successBox, warnBox } from "../lib/ui.js";

type ImportType = "transcript" | "document" | "json";
type ImportPhase = "taxonomy" | "cases" | "antipatterns" | "legacy";

interface ImportOpts {
  type: ImportType;
  phase: ImportPhase;
  confidence: string;
  portrait: string;
}

export const importCommand = new Command("import")
  .description("Import chunks into an existing portrait")
  .argument("<source>", "Source file to import")
  .option("--type <type>", "Source type: transcript, document, json", "json")
  .option("--phase <phase>", "Import phase: taxonomy, cases, antipatterns, legacy", "taxonomy")
  .option("--confidence <n>", "Default confidence score", "0.80")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .action(async (source: string, opts: ImportOpts) => {
    if (opts.type !== "json") {
      errorBox(
        `Import type "${opts.type}" is not yet supported.`,
        "Only --type json is available. Transcript and document extraction comes in Sprint 5.",
      );
      process.exit(1);
    }

    const sourcePath = resolve(source);
    if (!existsSync(sourcePath)) {
      errorBox(
        `Source file not found: ${sourcePath}`,
        "Check that the file path is correct.",
      );
      process.exit(1);
    }

    const portraitPath = resolvePortraitPath(opts.portrait);
    if (!existsSync(portraitPath)) {
      errorBox(
        `Portrait file not found: ${portraitPath}`,
        "Run 'athanor init <name>' first to create a portrait.",
      );
      process.exit(1);
    }

    const spinner = ora("Reading source file…").start();

    try {
      const raw = await readFile(sourcePath, "utf-8");
      let sourceData: unknown;
      try {
        sourceData = JSON.parse(raw);
      } catch {
        spinner.fail("Invalid JSON");
        errorBox(
          `Failed to parse ${sourcePath} as JSON.`,
          "Ensure the file contains valid JSON.",
        );
        process.exit(1);
      }

      spinner.text = "Loading portrait…";
      const portrait = await loadPortraitJSON(portraitPath);

      spinner.text = "Validating and merging chunks…";

      const data = sourceData as Record<string, unknown>;
      const newChunks = (Array.isArray(data.chunks) ? data.chunks : Array.isArray(data) ? data : []) as Chunk[];
      const newRelations = (Array.isArray(data.relations) ? data.relations : []) as Relation[];

      if (newChunks.length === 0) {
        spinner.fail("No chunks found");
        errorBox(
          "Source file contains no chunks to import.",
          "Expected a JSON object with a 'chunks' array, or a JSON array of chunks.",
        );
        process.exit(1);
      }

      let validChunks = 0;
      let skippedChunks = 0;
      let validRelations = 0;
      let skippedRelations = 0;
      const warnings: string[] = [];
      const existingIds = new Set(portrait.chunks.map((c) => c.chunk_id));

      for (const chunk of newChunks) {
        if (existingIds.has(chunk.chunk_id)) {
          skippedChunks++;
          warnings.push(`Duplicate chunk_id skipped: ${chunk.chunk_id}`);
          continue;
        }

        const result = validateChunk(chunk);
        if (result.valid) {
          portrait.chunks.push(chunk);
          existingIds.add(chunk.chunk_id);
          validChunks++;
          warnings.push(...result.warnings);
        } else {
          skippedChunks++;
          warnings.push(`Invalid chunk ${chunk.chunk_id ?? "(no id)"}: ${result.errors[0]}`);
        }
      }

      for (const rel of newRelations) {
        const result = validateRelation(rel);
        if (result.valid) {
          portrait.relations.push(rel);
          validRelations++;
        } else {
          skippedRelations++;
          warnings.push(`Invalid relation: ${result.errors[0]}`);
        }
      }

      // Update metadata
      const clusterCoverage: Record<string, number> = {};
      for (const c of portrait.chunks) {
        clusterCoverage[c.cluster] = (clusterCoverage[c.cluster] ?? 0) + 1;
      }
      portrait.metadata.chunk_count = portrait.chunks.length;
      portrait.metadata.relation_count = portrait.relations.length;
      portrait.metadata.cluster_coverage = clusterCoverage;

      spinner.text = "Saving portrait…";
      await savePortraitJSON(portraitPath, portrait);

      spinner.succeed("Import complete");
      console.log("");
      successBox(`${chalk.bold(validChunks)} chunks imported`);
      if (validRelations > 0) {
        successBox(`${chalk.bold(validRelations)} relations imported`);
      }
      if (skippedChunks > 0) {
        warnBox(`${skippedChunks} chunks skipped`);
      }
      if (skippedRelations > 0) {
        warnBox(`${skippedRelations} relations skipped`);
      }
      successBox(
        `Portrait now has ${chalk.bold(portrait.chunks.length)} chunks, ${chalk.bold(portrait.relations.length)} relations`,
      );

      if (warnings.length > 0) {
        console.log("");
        for (const w of warnings.slice(0, 10)) {
          warnBox(chalk.dim(w));
        }
        if (warnings.length > 10) {
          warnBox(chalk.dim(`… and ${warnings.length - 10} more warnings`));
        }
      }
      console.log("");
    } catch (err) {
      spinner.fail("Import failed");
      errorBox(
        err instanceof Error ? err.message : String(err),
      );
      process.exit(1);
    }
  });
