import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { select } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { errorBox, successBox } from "../lib/ui.js";
import { DEFAULT_CLI_PORTRAIT } from "../lib/portrait-io.js";

/** BCP 47 tags for interactive `init` (extend as needed). */
const PORTRAIT_LANGUAGES: { value: string; name: string }[] = [
  { value: "en", name: "English" },
  { value: "pl", name: "Polski" },
  { value: "de", name: "Deutsch" },
  { value: "fr", name: "Français" },
  { value: "es", name: "Español" },
  { value: "it", name: "Italiano" },
  { value: "pt", name: "Português" },
  { value: "nl", name: "Nederlands" },
  { value: "ja", name: "日本語" },
];

export const initCommand = new Command("init")
  .description("Create a new portrait directory with skeleton portrait.json")
  .argument("<name>", "Subject name for the portrait")
  .option(
    "-l, --language <lang>",
    "Portrait language (BCP 47, e.g. en, pl). Omit to pick interactively in a TTY.",
  )
  .option(
    "--output <dir>",
    `Directory for portrait.json (default: current directory → ${DEFAULT_CLI_PORTRAIT})`,
    ".",
  )
  .action(
    async (
      name: string,
      opts: { language?: string; output: string },
      cmd: Command,
    ) => {
      const dir = resolve(opts.output);
      const portraitPath = join(dir, "portrait.json");

      if (existsSync(portraitPath)) {
        errorBox(
          `Portrait already exists at ${portraitPath}`,
          "Use a different --output directory or remove the existing file.",
        );
        process.exit(1);
      }

      const langSource = cmd.getOptionValueSource?.("language");
      let language: string;
      if (langSource === "cli" || langSource === "env") {
        language = opts.language ?? "en";
      } else if (process.stdin.isTTY) {
        language = await select({
          message: "Portrait language",
          choices: PORTRAIT_LANGUAGES,
          default: "en",
        });
      } else {
        language = opts.language ?? "en";
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
            language,
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

        await writeFile(
          portraitPath,
          JSON.stringify(skeleton, null, 2) + "\n",
          "utf-8",
        );

        spinner.succeed("Portrait initialized");
        console.log("");
        successBox(`Subject: ${chalk.bold(name)}`);
        successBox(`ID: ${chalk.dim(subjectId)}`);
        successBox(`Language: ${chalk.bold(language)}`);
        successBox(`File: ${chalk.cyan(portraitPath)}`);
        console.log("");
        console.log(chalk.dim("  Next steps:"));
        console.log(chalk.dim("    pnpm athanor validate"));
        const relFromCwd = relative(process.cwd(), portraitPath);
        if (relFromCwd !== "portrait.json") {
          console.log(
            chalk.dim("    ") +
              chalk.dim("pnpm athanor validate --portrait ") +
              chalk.cyan(relFromCwd),
          );
        }
        console.log(
          chalk.dim("    pnpm athanor import <source.json> --type json"),
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
    },
  );
