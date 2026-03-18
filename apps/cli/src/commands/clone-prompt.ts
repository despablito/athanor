import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { Extractor } from "@athanor/extractor";
import { loadPortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox } from "../lib/ui.js";

interface CloneOpts {
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  portrait: string;
  output?: string;
}

export const clonePromptCommand = new Command("clone-prompt")
  .description("Generate a clone system prompt from portrait")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--output <path>", "Output file (defaults to stdout)")
  .action(async (opts: CloneOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait);
    const spinner = ora("Loading portrait…").start();

    try {
      const portrait = await loadPortraitJSON(portraitPath);

      spinner.text = `Synthesizing clone prompt with ${opts.provider}…`;
      const extractor = new Extractor({
        provider: opts.provider,
        model: opts.model,
        apiKey: opts.apiKey,
      });

      const prompt = await extractor.generateClonePrompt(portrait);
      spinner.stop();

      if (opts.output) {
        const outputPath = resolve(opts.output);
        await writeFile(outputPath, prompt + "\n", "utf-8");
        successBox(`Clone prompt written to ${chalk.cyan(outputPath)}`);
        successBox(`${chalk.bold(prompt.length.toString())} characters`);
        console.log("");
      } else {
        console.log("");
        console.log(prompt);
        console.log("");
      }
    } catch (err) {
      spinner.fail("Clone prompt generation failed");
      errorBox(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
