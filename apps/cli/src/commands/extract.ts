import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { Extractor } from "@athanor/extractor";
import type { PortraitJSON, Chunk } from "@athanor/core";
import { loadPortraitJSON, savePortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox, warnBox } from "../lib/ui.js";

interface ExtractOpts {
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  phase: string;
  portrait: string;
  subject?: string;
  language: string;
}

export const extractCommand = new Command("extract")
  .description("Extract chunks from source material using LLM")
  .argument("<source>", "Source file (transcript, document, notes)")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--phase <phase>", "Extraction phase: taxonomy, cases, antipatterns, legacy", "taxonomy")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--subject <name>", "Subject name")
  .option("--language <lang>", "Source language", "en")
  .action(async (source: string, opts: ExtractOpts) => {
    const sourcePath = resolve(source);
    if (!existsSync(sourcePath)) {
      errorBox(`Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    const portraitPath = resolvePortraitPath(opts.portrait);
    let portrait: PortraitJSON;

    if (existsSync(portraitPath)) {
      portrait = await loadPortraitJSON(portraitPath);
    } else {
      errorBox(
        `Portrait file not found: ${portraitPath}`,
        "Run 'athanor init <name>' first to create a portrait.",
      );
      process.exit(1);
    }

    const spinner = ora(`Reading source file…`).start();

    try {
      const text = await readFile(sourcePath, "utf-8");

      spinner.text = `Extracting chunks using ${opts.provider}…`;
      const extractor = new Extractor({
        provider: opts.provider,
        model: opts.model,
        apiKey: opts.apiKey,
      });

      const result = await extractor.fromTranscript(text, {
        subjectName: opts.subject ?? portrait.subject.name,
        source: opts.phase === "taxonomy" ? "interview" : "document",
        language: opts.language,
        portrait,
      });

      spinner.succeed("Extraction complete");
      console.log("");

      successBox(`${chalk.bold(result.chunks.length)} chunks extracted`);
      successBox(`${chalk.bold(result.accepted.length)} accepted after classification`);
      if (result.duplicates.length > 0) {
        warnBox(`${result.duplicates.length} duplicates filtered`);
      }

      // Merge accepted chunks into portrait
      if (result.accepted.length > 0) {
        spinner.start("Merging into portrait…");

        for (const chunk of result.accepted) {
          portrait.chunks.push({
            chunk_id: `PENDING-${portrait.chunks.length}`,
            author: portrait.subject.name,
            ...chunk,
            linked_chunks: [],
          } as unknown as Chunk);
        }

        // Update metadata
        const coverage: Record<string, number> = {};
        for (const c of portrait.chunks) {
          coverage[c.cluster] = (coverage[c.cluster] ?? 0) + 1;
        }
        portrait.metadata.chunk_count = portrait.chunks.length;
        portrait.metadata.cluster_coverage = coverage;

        await savePortraitJSON(portraitPath, portrait);
        spinner.succeed(`Merged ${result.accepted.length} chunks into portrait`);
      }

      // Show some sample extractions
      console.log("");
      const samples = result.accepted.slice(0, 3);
      for (const s of samples) {
        console.log(`  ${chalk.cyan(s.cluster)}/${chalk.magenta(s.type)} [${s.uniqueness}]`);
        console.log(`  ${chalk.dim(s.content.slice(0, 120))}…`);
        console.log("");
      }
    } catch (err) {
      spinner.fail("Extraction failed");
      errorBox(
        err instanceof Error ? err.message : String(err),
        `Check that ${opts.provider} is running and accessible.`,
      );
      process.exit(1);
    }
  });
