import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import {
  createProvider,
  warmupOllamaChat,
  DEFAULT_OLLAMA_CHAT_MODEL,
} from "@athanor/extractor";
import { CloneEngine, PortraitStore } from "@athanor/clone-api";
import {
  IdentityInquisitor,
  pickAttackVectors,
  describeAttackVector,
  type InquisitorPhase,
  type RedTeamScenarioResult,
} from "@athanor/interviewer";
import {
  loadPortraitIntoStore,
  DEFAULT_CLONE_CONNECTION,
} from "../lib/load-clone-portrait.js";
import { errorBox } from "../lib/ui.js";

const IDENTITY_GAP_THRESHOLD = 0.4;

/** `--fast` defaults (explicit CLI flags override via getOptionValueSource). */
const RED_TEAM_FAST = {
  scenarios: 1,
  contextTokens: 2000,
  rerankTopN: 8,
  vectorTopK: 8,
  ollamaModel: "llama3.2:1b",
  openaiModel: "gpt-4o-mini",
  anthropicModel: "claude-3-5-haiku-20241022",
  numPredict: "128",
} as const;

function resolveRedTeamConfig(
  opts: {
    provider: string;
    model?: string;
    vectorTopK: string;
    rerankTopN: string;
    contextTokens: string;
    scenarios: string;
    fast?: boolean;
  },
  cmd: Command,
): {
  scenarioCount: number;
  contextBudgetTokens: number;
  rerankTopN: number;
  vectorTopK: number;
  effectiveModel: string | undefined;
  fastActive: boolean;
} {
  const fast = Boolean(opts.fast);
  const fromCli = (name: string): boolean =>
    cmd.getOptionValueSource?.(name) === "cli";

  let scenarioCount = Math.max(1, parseInt(opts.scenarios, 10) || 3);
  let contextBudgetTokens = parseInt(opts.contextTokens, 10) || 3000;
  let rerankTopN = parseInt(opts.rerankTopN, 10) || 12;
  let vectorTopK = parseInt(opts.vectorTopK, 10) || 10;

  if (fast) {
    if (!fromCli("scenarios")) scenarioCount = RED_TEAM_FAST.scenarios;
    if (!fromCli("contextTokens")) contextBudgetTokens = RED_TEAM_FAST.contextTokens;
    if (!fromCli("rerankTopN")) rerankTopN = RED_TEAM_FAST.rerankTopN;
    if (!fromCli("vectorTopK")) vectorTopK = RED_TEAM_FAST.vectorTopK;
  }

  let effectiveModel = opts.model;
  if (fast && !fromCli("model")) {
    const p = opts.provider;
    if (p === "ollama") effectiveModel = RED_TEAM_FAST.ollamaModel;
    else if (p === "openai") effectiveModel = RED_TEAM_FAST.openaiModel;
    else if (p === "anthropic") effectiveModel = RED_TEAM_FAST.anthropicModel;
  }

  if (fast && process.env.OLLAMA_NUM_PREDICT === undefined) {
    process.env.OLLAMA_NUM_PREDICT = RED_TEAM_FAST.numPredict;
  }

  return {
    scenarioCount,
    contextBudgetTokens,
    rerankTopN,
    vectorTopK,
    effectiveModel,
    fastActive: fast,
  };
}

/** Spinner line: run index, actor, and what’s happening (clone step = RAG over the portrait graph). */
function redTeamProgressLine(
  run: number,
  total: number,
  phase: InquisitorPhase,
): string {
  const step: Record<InquisitorPhase, { who: string; what: string }> = {
    question: { who: "Inquisitor", what: "drafting question" },
    clone: { who: "Clone", what: "portrait graph → reply" },
    judge: { who: "Judge", what: "scoring defense" },
  };
  const { who, what } = step[phase];
  return (
    chalk.dim(`Run ${run}/${total} · `) +
    chalk.white(who) +
    chalk.dim(` · ${what}`)
  );
}

function divider(): void {
  console.log(chalk.dim("━".repeat(64)));
}

function formatScenario(
  index: number,
  result: RedTeamScenarioResult,
): void {
  const { attackVector, question, cloneResponse, evaluation } = result;
  const header = chalk.bold.magenta(`⚔  Scenario ${index + 1} — Adversarial probe`);
  console.log("");
  console.log(header);
  divider();
  console.log(chalk.bold.yellow("Attack vector"));
  console.log(chalk.white(describeAttackVector(attackVector)));
  console.log("");
  console.log(chalk.bold.cyan("Inquisitor's question"));
  console.log(chalk.white(question));
  console.log("");
  console.log(chalk.bold.green("Clone's defense"));
  console.log(chalk.gray(cloneResponse));
  console.log("");
  console.log(chalk.bold.blue("Inquisitor score"));
  const scoreBar = Math.round(evaluation.score * 100);
  const scoreColor =
    evaluation.score >= 0.7
      ? chalk.green
      : evaluation.score >= IDENTITY_GAP_THRESHOLD
        ? chalk.yellow
        : chalk.red;
  console.log(
    scoreColor(
      `${scoreBar}/100  ${evaluation.brokeCharacter ? "· broke character" : "· in-character"}`,
    ),
  );
  console.log(chalk.dim(evaluation.feedback));

  if (evaluation.score < IDENTITY_GAP_THRESHOLD) {
    console.log("");
    console.log(
      chalk.bold.red("⚠  IDENTITY GAP — clone collapsed or read as generic AI under pressure."),
    );
  }
  divider();
}

export const redTeamCommand = new Command("red-team")
  .description(
    "Adversarial self-play: probe cognitive consistency (CONTRASTS_WITH & orphan hard_rule)",
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
    "LLM provider for inquisitor + clone: ollama, anthropic, openai",
    "ollama",
  )
  .option("--model <m>", "Model name (provider-specific)")
  .option(
    "--api-key <key>",
    "API key for cloud providers (or set ANTHROPIC_API_KEY / OPENAI_API_KEY)",
  )
  .option(
    "--ollama-url <url>",
    "Ollama base URL",
    process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  )
  .option("--vector-top-k <n>", "RAG vector top-K", "10")
  .option("--rerank-top-n <n>", "RAG rerank top-N (red-team defaults lower than chat)", "12")
  .option(
    "--context-tokens <n>",
    "Max context budget for clone RAG (rough tokens; red-team default lower than chat)",
    "3000",
  )
  .option(
    "--scenarios <n>",
    "Number of attack scenarios to run",
    "3",
  )
  .option(
    "--fast",
    "Faster local run: 1 scenario, tighter RAG, shorter answers (OLLAMA_NUM_PREDICT=128); default model llama3.2:1b (Ollama), gpt-4o-mini (OpenAI), claude-3-5-haiku (Anthropic). Explicit flags override preset.",
    false,
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
        scenarios: string;
        fast: boolean;
      },
      cmd: Command,
    ) => {
      console.log("");
      console.log(
        chalk.bold.red("☠  ") +
          chalk.bold.white("ATHANOR RED TEAM") +
          chalk.dim(" — adversarial identity interrogation"),
      );
      console.log("");

      let store: PortraitStore;
      try {
        store = await loadPortraitIntoStore({
          portrait: opts.portrait,
          connection: opts.connection,
          subject: opts.subject,
          subjectName: opts.subjectName,
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
      const portrait = store.get(portraitId);
      if (!portrait) {
        errorBox("Portrait missing from store.");
        process.exit(1);
        return;
      }

      const provider = opts.provider as "ollama" | "anthropic" | "openai";
      if (!["ollama", "anthropic", "openai"].includes(provider)) {
        errorBox(`Invalid --provider: ${opts.provider}`);
        process.exit(1);
        return;
      }

      const cfg = resolveRedTeamConfig(opts, cmd);
      const scenarioCount = cfg.scenarioCount;
      const available = pickAttackVectors(portrait, 9999);
      if (available.length === 0) {
        console.log(
          chalk.yellow(
            "No attack vectors found. Add CONTRASTS_WITH relations between chunks and/or " +
              "`hard_rule` chunks without INSTANTIATES examples.",
          ),
        );
        process.exit(0);
        return;
      }

      const llm = createProvider({
        provider,
        model: cfg.effectiveModel,
        apiKey: opts.apiKey,
        baseUrl: provider === "ollama" ? opts.ollamaUrl : undefined,
      });

      const engine = new CloneEngine(store, {
        provider: {
          provider,
          model: cfg.effectiveModel,
          apiKey: opts.apiKey,
          baseUrl: provider === "ollama" ? opts.ollamaUrl : undefined,
        },
        ragConfig: {
          topK: cfg.vectorTopK,
          topN: cfg.rerankTopN,
          contextBudgetTokens: cfg.contextBudgetTokens,
        },
      });

      const inquisitor = new IdentityInquisitor(llm, engine, portrait);

      const displayModel =
        cfg.effectiveModel ??
        (provider === "ollama"
          ? process.env.OLLAMA_MODEL ?? process.env.LLM_MODEL ?? DEFAULT_OLLAMA_CHAT_MODEL
          : undefined);
      console.log(
        chalk.dim(
          `Portrait: ${chalk.white.bold(list[0]!.name)} (${portrait.chunks.length} chunks) · ` +
            `${provider}${displayModel ? ` / ${displayModel}` : ""} · ` +
            `${Math.min(scenarioCount, available.length)} scenario(s)`,
        ),
      );
      console.log(
        chalk.dim(
          `Found ${available.length} attack vector(s); running ${Math.min(scenarioCount, available.length)}.`,
        ),
      );
      if (cfg.fastActive) {
        console.log(
          chalk.dim(
            "Preset --fast: 1 scenario (unless --scenarios), tighter RAG, shorter answers; " +
              "default small/fast model unless --model.",
          ),
        );
      }
      if (provider === "ollama") {
        console.log(
          chalk.dim(
            "Each run: 3 LLM steps (question → graph-backed reply → judge). " +
              "Ollama loads the model once; that step can take several minutes on CPU.",
          ),
        );
      }
      console.log("");

      const total = Math.min(scenarioCount, available.length);
      const spinner = ora({
        text: redTeamProgressLine(1, total, "question"),
        color: "red",
      }).start();

      try {
        if (provider === "ollama") {
          const ollamaModel =
            cfg.effectiveModel ??
            process.env.OLLAMA_MODEL ??
            process.env.LLM_MODEL ??
            DEFAULT_OLLAMA_CHAT_MODEL;
          spinner.text =
            chalk.dim("Ollama · ") +
            chalk.white("loading model") +
            chalk.dim(" (first time can be slow on CPU)…");
          const warmAbort = new AbortController();
          const warmTimer = setTimeout(() => warmAbort.abort(), 900_000);
          try {
            await warmupOllamaChat({
              model: ollamaModel,
              baseUrl: opts.ollamaUrl,
              signal: warmAbort.signal,
            });
          } finally {
            clearTimeout(warmTimer);
          }
          spinner.text = redTeamProgressLine(1, total, "question");
        }

        const results = await inquisitor.runScenarios(total, (i, n, phase) => {
          spinner.text = redTeamProgressLine(i, n, phase);
        });
        spinner.succeed(chalk.green("Interrogation complete."));
        for (let i = 0; i < results.length; i++) {
          formatScenario(i, results[i]!);
        }

        const avg =
          results.reduce((s, r) => s + r.evaluation.score, 0) / results.length;
        console.log("");
        console.log(
          chalk.bold.white(`Mean identity score: ${(avg * 100).toFixed(0)}/100`),
        );
        if (avg < IDENTITY_GAP_THRESHOLD) {
          console.log(chalk.red.bold("Overall: fragile identity under adversarial pressure."));
        } else if (avg < 0.7) {
          console.log(chalk.yellow.bold("Overall: mixed — some slippage."));
        } else {
          console.log(chalk.green.bold("Overall: strong in-character coherence."));
        }
        console.log("");
      } catch (err) {
        spinner.fail(chalk.red("Red team run failed"));
        errorBox(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    },
  );
