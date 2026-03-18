import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { Extractor } from "@athanor/extractor";
import { loadPortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox } from "../lib/ui.js";

interface EmbedOpts {
  provider: "ollama" | "openai";
  model?: string;
  apiKey?: string;
  portrait: string;
  output?: string;
}

export const embedCommand = new Command("embed")
  .description("Generate vector embeddings for portrait chunks")
  .option("--provider <p>", "Embedding provider: ollama, openai", "ollama")
  .option("--model <m>", "Embedding model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--output <path>", "Output JSON file for embeddings")
  .action(async (opts: EmbedOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait);
    const spinner = ora("Loading portrait…").start();

    try {
      const portrait = await loadPortraitJSON(portraitPath);

      if (portrait.chunks.length === 0) {
        spinner.warn("Portrait has no chunks to embed");
        return;
      }

      const extractor = new Extractor({
        provider: "ollama",
        embeddingProvider: opts.provider,
        embeddingModel: opts.model,
        apiKey: opts.apiKey,
      });

      spinner.text = `Embedding ${portrait.chunks.length} chunks with ${opts.provider}…`;

      const embeddings = await extractor.embedChunks(portrait, (progress) => {
        spinner.text = `Embedding chunk ${progress.current}/${progress.total}: ${progress.chunkId}`;
      });

      spinner.succeed(`Embedded ${embeddings.length} chunks`);
      console.log("");

      if (opts.output) {
        const outputPath = resolve(opts.output);
        await writeFile(
          outputPath,
          JSON.stringify(embeddings, null, 2) + "\n",
          "utf-8",
        );
        successBox(`Embeddings written to ${chalk.cyan(outputPath)}`);
      } else {
        successBox(`${chalk.bold(embeddings.length.toString())} embeddings generated`);
        successBox(`Dimensions: ${chalk.bold(embeddings[0]?.embedding.length.toString() ?? "0")}`);
      }

      console.log("");
    } catch (err) {
      spinner.fail("Embedding failed");
      errorBox(
        err instanceof Error ? err.message : String(err),
        `Check that ${opts.provider} is running and the embedding model is available.`,
      );
      process.exit(1);
    }
  });
