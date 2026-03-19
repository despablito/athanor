import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import { createProvider, generateSecondOrderConsequences } from "@athanor/extractor";
import { asChunkId, type SourceType, type Uniqueness } from "@athanor/core";
import { loadPortraitJSON, jsonToPortrait, savePortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox, warnBox } from "../lib/ui.js";

interface SecondOrderOpts {
  portrait: string;
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  threshold: number;
  dryRun: boolean;
  apply: boolean;
}

export const secondOrderCommand = new Command("second-order")
  .description("Generate second-order meta-chunk consequences")
  .option("--portrait <path>", "Portrait JSON file", "./portrait.json")
  .option("--provider <name>", "LLM provider: ollama|anthropic|openai", "ollama")
  .option("--model <name>", "Model name (optional)")
  .option("--threshold <n>", "Minimum confidence 0.0–1.0", (v) => parseFloat(v), 0.75)
  .option("--dry-run", "Print results without modifying portrait", true)
  .option("--apply", "Actually add approved chunks to portrait (requires confirmation)", false)
  .action(async (opts: SecondOrderOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait);
    const portraitJSON = await loadPortraitJSON(portraitPath);
    const portrait = jsonToPortrait(portraitJSON);

    const metaCount = portraitJSON.chunks.filter((c) => c.type === "meta").length;
    console.log(`Analyzing ${metaCount} meta-chunks...`);

    const provider = createProvider({
      provider: opts.provider,
      model: opts.model,
    });

    const spinner = ora("Generating second-order consequences…").start();
    try {
      const analysis = await generateSecondOrderConsequences(portrait, provider, {
        confidenceThreshold: opts.threshold,
      });

      spinner.stop();
      console.log("");

      for (const r of analysis.results) {
        const pct = Math.round(r.confidence * 100);
        const tags = (r.suggestedChunk.context_tags ?? []).slice(0, 3).join(", ");

        console.log(`→ ${chalk.cyan(r.sourceChunkId)}  [${chalk.dim(tags)}]`);
        console.log(`  Confidence: ${chalk.bold(`${pct}%`)}`);
        console.log(`  Consequence: ${chalk.green(r.consequence)}`);
        console.log(`  Why non-obvious: ${chalk.yellow(r.reasoning)}`);
        console.log("");
      }

      console.log(
        `Skipped: ${analysis.skipped}  (low confidence or already captured in portrait)`,
      );

      if (!opts.apply) {
        console.log("");
        console.log(
          `Run with --apply to add ${analysis.results.length} chunks to portrait.`,
        );
        return;
      }

      const confirm = await inquirer.prompt<{ confirmed: boolean }>([
        {
          type: "confirm",
          name: "confirmed",
          message: `Apply ${analysis.results.length} second-order chunk(s) to ${opts.portrait}?`,
          default: false,
        },
      ]);

      if (!confirm.confirmed) {
        warnBox("Aborted. No changes applied.");
        return;
      }

      const applySpinner = ora("Applying changes to portrait…").start();
      try {
        for (const r of analysis.results) {
          const suggested = r.suggestedChunk;

          const added = portrait.addChunk({
            author: portraitJSON.subject.name,
            cluster: suggested.cluster as string,
            type: "meta",
            uniqueness: suggested.uniqueness as Uniqueness,
            source: suggested.source as SourceType,
            confidence: suggested.confidence as number,
            context_tags: (suggested.context_tags ?? []) as string[],
            linked_chunks: ((suggested.linked_chunks ?? []) as string[]).map((id) =>
              asChunkId(id),
            ),
            content: suggested.content as string,
          });

          portrait.addRelation({
            source: asChunkId(r.sourceChunkId),
            target: added.chunk_id,
            type: "ENABLES",
          });
        }

        const updated = portrait.toJSON();
        await savePortraitJSON(portraitPath, updated);
        applySpinner.succeed(`Portrait updated: ${updated.chunks.length} chunks`);
        successBox(`Added ${analysis.results.length} second-order consequence chunk(s)`);
      } finally {
        applySpinner.stop();
      }
    } catch (err) {
      spinner.fail("Second-order generation failed");
      errorBox(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

