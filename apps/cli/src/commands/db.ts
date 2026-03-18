import { Command } from "commander";

import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { GraphStore, type PortraitJSON, type Chunk, type Relation } from "@athanor/core";
import { loadPortraitJSON, jsonToPortrait, resolvePortraitPath, savePortraitJSON } from "../lib/portrait-io.js";
import { errorBox, successBox } from "../lib/ui.js";

const DEFAULT_CONNECTION = "postgres://localhost:5432/athanor";

export const dbCommand = new Command("db")
  .description("Database operations (PostgreSQL + Apache AGE)");

dbCommand
  .command("push")
  .description("Push portrait to PostgreSQL+AGE database")
  .option("--connection <url>", "PostgreSQL connection string", DEFAULT_CONNECTION)
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .action(async (opts: { connection: string; portrait: string }) => {
    const portraitPath = resolvePortraitPath(opts.portrait);

    const spinner = ora("Loading portrait…").start();

    try {
      const json = await loadPortraitJSON(portraitPath);
      const portrait = jsonToPortrait(json);

      spinner.text = `Connecting to database…`;
      const graphName = `portrait_${json.subject.id.replace(/[^a-z0-9_]/g, "_")}`;
      const store = new GraphStore(opts.connection, graphName);

      try {
        await store.connect();

        spinner.text = `Importing ${json.metadata.chunk_count} chunks and ${json.metadata.relation_count} relations…`;
        await store.importPortrait(portrait);

        spinner.succeed("Portrait pushed to database");
        console.log("");
        successBox(`Graph: ${chalk.bold(graphName)}`);
        successBox(`Chunks: ${chalk.bold(json.metadata.chunk_count.toString())}`);
        successBox(`Relations: ${chalk.bold(json.metadata.relation_count.toString())}`);
        successBox(`Connection: ${chalk.dim(opts.connection.replace(/:[^:@]*@/, ":***@"))}`);
        console.log("");
      } finally {
        await store.close();
      }
    } catch (err) {
      spinner.fail("Push failed");
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ECONNREFUSED")) {
        errorBox(
          "Could not connect to database.",
          `Ensure PostgreSQL is running at ${opts.connection} with the AGE extension installed.`,
        );
      } else {
        errorBox(message);
      }
      process.exit(1);
    }
  });

dbCommand
  .command("pull")
  .description("Export portrait from database to JSON")
  .option("--connection <url>", "PostgreSQL connection string", DEFAULT_CONNECTION)
  .option("--output <path>", "Output portrait file path", "./portrait.json")
  .option("--subject <id>", "Subject ID to export")
  .action(async (opts: { connection: string; output: string; subject?: string }) => {
    if (!opts.subject) {
      errorBox(
        "Missing --subject option.",
        "Specify the subject ID to export, e.g.: athanor db pull --subject jan-kowalski",
      );
      process.exit(1);
    }

    const outputPath = resolve(opts.output);
    const spinner = ora("Connecting to database…").start();

    try {
      const store = new GraphStore(opts.connection);

      try {
        await store.connect();

        spinner.text = `Exporting portrait for ${opts.subject}…`;
        const raw = await store.exportPortrait(opts.subject);

        const chunks = (raw.chunks ?? []) as Chunk[];
        const relations = (raw.relations ?? []) as Relation[];

        const clusterCoverage: Record<string, number> = {};
        for (const c of chunks) {
          clusterCoverage[c.cluster] = (clusterCoverage[c.cluster] ?? 0) + 1;
        }

        const portraitJSON: PortraitJSON = {
          version: "1.0.0-draft",
          subject: { name: opts.subject, id: opts.subject },
          created_at: new Date().toISOString(),
          chunks,
          relations,
          metadata: {
            completeness_score: 0,
            chunk_count: chunks.length,
            relation_count: relations.length,
            cluster_coverage: clusterCoverage,
          },
        };

        spinner.text = "Saving portrait…";
        await savePortraitJSON(outputPath, portraitJSON);

        spinner.succeed("Portrait pulled from database");
        console.log("");
        successBox(`Subject: ${chalk.bold(opts.subject)}`);
        successBox(`Chunks: ${chalk.bold(chunks.length.toString())}`);
        successBox(`Relations: ${chalk.bold(relations.length.toString())}`);
        successBox(`Output: ${chalk.cyan(outputPath)}`);
        console.log("");
      } finally {
        await store.close();
      }
    } catch (err) {
      spinner.fail("Pull failed");
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ECONNREFUSED")) {
        errorBox(
          "Could not connect to database.",
          `Ensure PostgreSQL is running at ${opts.connection} with the AGE extension installed.`,
        );
      } else {
        errorBox(message);
      }
      process.exit(1);
    }
  });
