import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { ok, errorBox, successBox } from "../lib/ui.js";

export const initCommand = new Command("init")
  .description("Create a new portrait directory with skeleton portrait.json")
  .argument("<name>", "Subject name for the portrait")
  .option("--language <lang>", "Portrait language", "en")
  .option("--output <dir>", "Output directory", "./portrait")
  .action(async (name: string, opts: { language: string; output: string }) => {
    const dir = resolve(opts.output);
    const portraitPath = join(dir, "portrait.json");

    if (existsSync(portraitPath)) {
      errorBox(
        `Portrait already exists at ${portraitPath}`,
        "Use a different --output directory or remove the existing file.",
      );
      process.exit(1);
    }

    const spinner = ora("Initializing portrait…").start();

    try {
      await mkdir(dir, { recursive: true });

      const subjectId = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const skeleton = {
        version: "1.0.0-draft",
        subject: {
          name,
          id: subjectId,
        },
        created_at: new Date().toISOString(),
        chunks: [],
        relations: [],
        metadata: {
          completeness_score: 0,
          chunk_count: 0,
          relation_count: 0,
          cluster_coverage: {},
        },
      };

      await writeFile(portraitPath, JSON.stringify(skeleton, null, 2) + "\n", "utf-8");

      spinner.succeed("Portrait initialized");
      console.log("");
      successBox(`Subject: ${chalk.bold(name)}`);
      successBox(`ID: ${chalk.dim(subjectId)}`);
      successBox(`Language: ${opts.language}`);
      successBox(`File: ${chalk.cyan(portraitPath)}`);
      console.log("");
      console.log(
        chalk.dim("  Next steps:"),
      );
      console.log(
        chalk.dim("    athanor import <source.json> --type json"),
      );
      console.log(
        chalk.dim("    athanor validate"),
      );
      console.log("");
    } catch (err) {
      spinner.fail("Failed to initialize portrait");
      errorBox(
        err instanceof Error ? err.message : String(err),
        "Check that the output directory is writable.",
      );
      process.exit(1);
    }
  });
