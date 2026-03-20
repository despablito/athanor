import { Command } from "commander";
import { input } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { CloneEngine, PortraitStore } from "@athanor/clone-api";
import {
  loadPortraitIntoStore,
  DEFAULT_CLONE_CONNECTION,
} from "../lib/load-clone-portrait.js";
import { requireCloudApiKey } from "../lib/llm-provider-config.js";
import { errorBox } from "../lib/ui.js";

export const chatCommand = new Command("chat")
  .description(
    "Graph-aware RAG chat with your clone; does not modify the portrait (use `athanor interview` to add chunks via dialogue)",
  )
  .option("--portrait <path>", "Portrait JSON file", "./portrait.json")
  .option(
    "--connection <url>",
    "Database URL (with --subject)",
    DEFAULT_CLONE_CONNECTION,
  )
  .option(
    "--subject <id>",
    "Load portrait from the graph store by subject id (skips --portrait file)",
  )
  .option(
    "--subject-name <name>",
    "Display name when loading from DB (defaults to subject id)",
  )
  .option(
    "--provider <name>",
    "LLM provider: ollama, anthropic, openai",
    "ollama",
  )
  .option("--model <m>", "Model name (provider-specific)")
  .option("--api-key <key>", "API key (or set ANTHROPIC_API_KEY / OPENAI_API_KEY)")
  .option(
    "--ollama-url <url>",
    "Ollama base URL",
    process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  )
  .option("--vector-top-k <n>", "RAG vector top-K", "10")
  .option("--rerank-top-n <n>", "RAG rerank top-N", "15")
  .option(
    "--context-tokens <n>",
    "Max context budget (rough tokens)",
    "4000",
  )
  .action(
    async (
      opts: {
        portrait: string;
        connection: string;
        subject?: string;
        subjectName?: string;
        provider: string;
        model?: string;
        apiKey?: string;
        ollamaUrl: string;
        vectorTopK: string;
        rerankTopN: string;
        contextTokens: string;
      },
      cmd: Command,
    ) => {
      console.log("");
      console.log(chalk.bold("Athanor clone chat"));
      console.log(
        chalk.dim(
          "Read-only on the portrait — graph-aware RAG. To grow the graph via Q&A, run: ",
        ) + chalk.cyan("athanor interview"),
      );
      console.log(chalk.dim("Type exit or quit to leave.\n"));

      let store: PortraitStore;
      try {
        store = await loadPortraitIntoStore({
          portrait: opts.portrait,
          connection: opts.connection,
          subject: opts.subject,
          subjectName: opts.subjectName,
          allowWorkspaceExampleFallback:
            cmd.getOptionValueSource?.("portrait") !== "cli",
        });
      } catch (err) {
        errorBox(err instanceof Error ? err.message : String(err));
        process.exit(1);
        return;
      }

      const list = store.list();
      if (list.length === 0) {
        errorBox("No portrait loaded.");
        process.exit(1);
        return;
      }

      const portraitId = list[0]!.id;

      const provider = opts.provider as "ollama" | "anthropic" | "openai";
      if (!["ollama", "anthropic", "openai"].includes(provider)) {
        errorBox(`Invalid --provider: ${opts.provider}`);
        process.exit(1);
        return;
      }

      let resolvedApiKey: string | undefined;
      try {
        resolvedApiKey = requireCloudApiKey(provider, opts.apiKey);
      } catch (err) {
        errorBox(err instanceof Error ? err.message : String(err));
        process.exit(1);
        return;
      }

      const engine = new CloneEngine(store, {
        provider: {
          provider,
          model: opts.model,
          apiKey: resolvedApiKey,
          baseUrl: provider === "ollama" ? opts.ollamaUrl : undefined,
        },
        ragConfig: {
          topK: parseInt(opts.vectorTopK, 10) || 10,
          topN: parseInt(opts.rerankTopN, 10) || 15,
          contextBudgetTokens: parseInt(opts.contextTokens, 10) || 4000,
        },
      });

      console.log(
        chalk.dim(
          `Portrait: ${list[0]!.name} (${list[0]!.chunk_count} chunks) · ${provider}${opts.model ? ` / ${opts.model}` : ""}`,
        ),
      );
      console.log("");

      const history: Array<{ role: "user" | "assistant"; content: string }> =
        [];

      while (true) {
        let line: string;
        try {
          line = await input({
            message: chalk.bold.cyan("You:"),
          });
        } catch (err) {
          if (
            err instanceof Error &&
            (err.message.includes("User force closed") ||
              err.name === "ExitPromptError")
          ) {
            console.log(chalk.dim("\nBye."));
            break;
          }
          console.error(
            chalk.red(err instanceof Error ? err.message : String(err)),
          );
          break;
        }

        const trimmed = line.trim();
        if (!trimmed) continue;

        const lower = trimmed.toLowerCase();
        if (lower === "exit" || lower === "quit") {
          console.log(chalk.dim("Bye."));
          break;
        }

        const spinner = ora({
          text: chalk.dim("Clone is thinking…"),
          color: "cyan",
        }).start();

        try {
          const result = await engine.chat(portraitId, {
            message: trimmed,
            history,
          });
          spinner.stop();
          console.log(chalk.green(result.response));
          console.log(
            chalk.dim(
              `[Confidence: ${result.confidence.toFixed(2)} | Sources: ${result.sources.length}]`,
            ),
          );
          console.log("");
          history.push({ role: "user", content: trimmed });
          history.push({ role: "assistant", content: result.response });
        } catch (err) {
          spinner.fail(chalk.red("Something went wrong"));
          const msg = err instanceof Error ? err.message : String(err);
          console.error(chalk.red(msg));
          console.log(
            chalk.dim("You can try again — the session stays open.\n"),
          );
        }
      }
    },
  );
