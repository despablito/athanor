import { Command } from "commander";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import chalk from "chalk";
import { errorBox, info } from "../lib/ui.js";

interface ServeOpts {
  port: string;
  portrait?: string;
  provider: string;
  model?: string;
  apiKey?: string;
}

export const serveCommand = new Command("serve")
  .description("Start the clone API server")
  .option("--port <port>", "Server port", "3000")
  .option("--portrait <path>", "Portrait JSON file to load")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .action(async (opts: ServeOpts) => {
    // Validate portrait path if provided
    let portraitPath: string | undefined;
    if (opts.portrait) {
      portraitPath = resolve(opts.portrait);
      if (!existsSync(portraitPath)) {
        errorBox(`Portrait not found: ${portraitPath}`);
        process.exit(1);
      }
    }

    console.log("");
    console.log(`  ${info} ${chalk.bold("Athanor Clone API")}`);
    console.log("");

    try {
      // Dynamic import to avoid pulling in the clone-api dependencies
      // when only using other CLI commands
      const { startServer } = await import("@athanor/clone-api");

      await startServer({
        port: parseInt(opts.port, 10),
        portraitPath: portraitPath ?? null,
        llmProvider: opts.provider as "ollama" | "anthropic" | "openai",
        llmModel: opts.model,
        apiKey: opts.apiKey,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Cannot find module") ||
         err.message.includes("ERR_MODULE_NOT_FOUND"))
      ) {
        errorBox(
          "Clone API package not found",
          "Install @athanor/clone-api: pnpm install",
        );
      } else {
        errorBox(err instanceof Error ? err.message : String(err));
      }
      process.exit(1);
    }
  });
