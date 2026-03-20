import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { Extractor } from "@athanor/extractor";
import type { Chunk } from "@athanor/core";
import { loadPortraitJSON, savePortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox } from "../lib/ui.js";

interface MetaOpts {
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  portrait: string;
}

export const metaGenerateCommand = new Command("meta-generate")
  .description("Generate meta-chunks from portrait graph analysis")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .action(async (opts: MetaOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait, {
      fallbackToExample: false,
    });
    const spinner = ora("Loading portrait…").start();

    try {
      const portrait = await loadPortraitJSON(portraitPath);

      spinner.text = `Analyzing graph structure with ${opts.provider}…`;
      const extractor = new Extractor({
        provider: opts.provider,
        model: opts.model,
        apiKey: opts.apiKey,
      });

      const metaChunks = await extractor.generateMetaChunks(portrait);

      if (metaChunks.length === 0) {
        spinner.warn("No meta-chunks generated");
        return;
      }

      // Add to portrait
      for (const chunk of metaChunks) {
        portrait.chunks.push({
          chunk_id: `META-META-${String(portrait.chunks.length).padStart(3, "0")}`,
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

      spinner.succeed(`Generated ${metaChunks.length} meta-chunks`);
      console.log("");

      for (const m of metaChunks) {
        console.log(`  ${chalk.cyan("meta-patterns")}/${chalk.magenta("meta")} [${m.uniqueness}]`);
        console.log(`  ${chalk.dim(m.content.slice(0, 150))}…`);
        console.log("");
      }

      successBox(`Portrait updated: ${portrait.chunks.length} total chunks`);
      console.log("");
    } catch (err) {
      spinner.fail("Meta-generation failed");
      errorBox(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
