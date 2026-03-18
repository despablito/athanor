import { Command } from "commander";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { toJSON, toCypher, toMarkdown, toObsidian } from "@athanor/core";
import { loadPortraitJSON, jsonToPortrait, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox } from "../lib/ui.js";

const FORMATS = ["json", "cypher", "markdown", "obsidian"] as const;
type ExportFormat = (typeof FORMATS)[number];

export const exportCommand = new Command("export")
  .description("Export portrait to various formats")
  .argument("<format>", `Output format: ${FORMATS.join(", ")}`)
  .argument("<output>", "Output file or directory path")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .action(async (format: string, output: string, opts: { portrait: string }) => {
    if (!FORMATS.includes(format as ExportFormat)) {
      errorBox(
        `Unknown format: "${format}"`,
        `Supported formats: ${FORMATS.join(", ")}`,
      );
      process.exit(1);
    }

    const portraitPath = resolvePortraitPath(opts.portrait);
    const outputPath = resolve(output);

    const spinner = ora(`Exporting as ${format}…`).start();

    try {
      const json = await loadPortraitJSON(portraitPath);
      const portrait = jsonToPortrait(json);

      switch (format as ExportFormat) {
        case "json": {
          const content = toJSON(portrait);
          await mkdir(dirname(outputPath), { recursive: true });
          await writeFile(outputPath, content + "\n", "utf-8");
          spinner.succeed(`Exported JSON to ${chalk.cyan(outputPath)}`);
          break;
        }
        case "cypher": {
          const content = toCypher(portrait);
          await mkdir(dirname(outputPath), { recursive: true });
          await writeFile(outputPath, content + "\n", "utf-8");
          spinner.succeed(`Exported Cypher to ${chalk.cyan(outputPath)}`);
          break;
        }
        case "markdown": {
          const content = toMarkdown(portrait);
          await mkdir(dirname(outputPath), { recursive: true });
          await writeFile(outputPath, content + "\n", "utf-8");
          spinner.succeed(`Exported Markdown to ${chalk.cyan(outputPath)}`);
          break;
        }
        case "obsidian": {
          const files = toObsidian(portrait);
          await mkdir(outputPath, { recursive: true });
          let count = 0;
          for (const [filename, content] of files) {
            await writeFile(join(outputPath, filename), content + "\n", "utf-8");
            count++;
          }
          spinner.succeed(
            `Exported ${chalk.bold(count.toString())} Obsidian files to ${chalk.cyan(outputPath)}`,
          );
          break;
        }
      }

      console.log("");
      successBox(`${json.metadata.chunk_count} chunks, ${json.metadata.relation_count} relations exported`);
      console.log("");
    } catch (err) {
      spinner.fail("Export failed");
      errorBox(
        err instanceof Error ? err.message : String(err),
      );
      process.exit(1);
    }
  });
