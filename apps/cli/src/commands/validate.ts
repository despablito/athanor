import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { validatePortrait, RECOMMENDED_CLUSTERS } from "@athanor/core";
import {
  loadPortraitJSON,
  resolvePortraitPath,
  resolvePortraitPathForReadCommand,
} from "../lib/portrait-io.js";
import { ok, warn, fail, heading, errorBox } from "../lib/ui.js";

export const validateCommand = new Command("validate")
  .description("Validate a portrait against the Athanor protocol schema")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .action(async (opts: { portrait: string }) => {
    const naivePath = resolvePortraitPath(opts.portrait);
    const portraitPath = resolvePortraitPathForReadCommand(opts.portrait);

    const spinner = ora("Validating portrait…").start();

    try {
      const portrait = await loadPortraitJSON(portraitPath);
      const result = validatePortrait(portrait);

      spinner.stop();

      console.log("");
      console.log(`  ${heading("Portrait Validation")}`);
      console.log(`  ${chalk.dim(portraitPath)}`);
      if (portraitPath !== naivePath) {
        console.log(
          `  ${chalk.dim("(default --portrait resolved here; flat ./portrait.json vs ./portrait/portrait.json)")}`,
        );
      }
      console.log("");

      if (result.valid) {
        console.log(`  ${ok} ${chalk.green("Schema valid")}`);
      } else {
        console.log(`  ${fail} ${chalk.red("Schema invalid")}`);
      }

      // Summary stats
      console.log(
        `  ${ok} ${chalk.bold(portrait.metadata.chunk_count)} chunks, ${chalk.bold(portrait.metadata.relation_count)} relations`,
      );

      // CRITICAL ratio
      const chunks = portrait.chunks;
      if (chunks.length > 0) {
        const criticalCount = chunks.filter((c) => c.uniqueness === "CRITICAL").length;
        const criticalRatio = criticalCount / chunks.length;
        const pct = (criticalRatio * 100).toFixed(0);
        if (criticalRatio >= 0.3 && criticalRatio <= 0.4) {
          console.log(`  ${ok} CRITICAL ratio: ${pct}% ${chalk.dim("(target: 30–40%)")}`);
        } else {
          console.log(`  ${warn} CRITICAL ratio: ${chalk.yellow(pct + "%")} ${chalk.dim("(target: 30–40%)")}`);
        }
      }

      // Missing clusters
      const presentClusters = new Set(chunks.map((c) => c.cluster));
      const missing = RECOMMENDED_CLUSTERS.filter((c) => !presentClusters.has(c));
      if (missing.length === 0) {
        console.log(`  ${ok} All recommended clusters present`);
      } else {
        for (const m of missing) {
          console.log(`  ${warn} Missing cluster: ${chalk.yellow(m)}`);
        }
      }

      // Orphan chunks
      const chunkIdsInRelations = new Set<string>();
      for (const rel of portrait.relations) {
        chunkIdsInRelations.add(rel.source);
        chunkIdsInRelations.add(rel.target);
      }
      const orphans = chunks.filter((c) => !chunkIdsInRelations.has(c.chunk_id));
      if (orphans.length === 0) {
        console.log(`  ${ok} No orphan chunks`);
      } else {
        console.log(
          `  ${fail} ${chalk.red(orphans.length.toString())} orphan chunk${orphans.length === 1 ? "" : "s"} with no relations`,
        );
        for (const o of orphans.slice(0, 5)) {
          console.log(`    ${chalk.dim("→")} ${chalk.dim(o.chunk_id)} ${chalk.dim(`(${o.cluster})`)}`);
        }
        if (orphans.length > 5) {
          console.log(`    ${chalk.dim(`… and ${orphans.length - 5} more`)}`);
        }
      }

      // Warnings from validator
      for (const w of result.warnings) {
        // Skip warnings we already displayed above
        if (w.startsWith("Low CRITICAL") || w.startsWith("Missing recommended") || w.startsWith("Orphan chunk")) {
          continue;
        }
        console.log(`  ${warn} ${w}`);
      }

      // Errors
      for (const e of result.errors) {
        console.log(`  ${fail} ${chalk.red(e)}`);
      }

      // Score
      const score = portrait.metadata.completeness_score;
      const scoreColor = score >= 0.8 ? chalk.green : score >= 0.5 ? chalk.yellow : chalk.red;
      console.log("");
      console.log(`  Score: ${scoreColor(score.toFixed(2))} / 1.00`);
      console.log("");

      if (!result.valid) {
        process.exit(1);
      }
    } catch (err) {
      spinner.fail("Validation failed");
      errorBox(
        err instanceof Error ? err.message : String(err),
        "Check that the portrait file exists and contains valid JSON.",
      );
      process.exit(1);
    }
  });
