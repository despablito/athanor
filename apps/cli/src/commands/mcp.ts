import { Command } from "commander";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import chalk from "chalk";
import { errorBox, info } from "../lib/ui.js";

interface McpOpts {
  transport: string;
  port: string;
  portrait?: string;
  provider: string;
  model?: string;
  apiKey?: string;
}

export const mcpCommand = new Command("mcp")
  .description("Start the Athanor MCP server")
  .option("--transport <type>", "Transport: stdio or sse", "stdio")
  .option("--port <port>", "Port for SSE transport", "3001")
  .option("--portrait <path>", "Portrait JSON file to load")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .action(async (opts: McpOpts) => {
    let portraitPath: string | undefined;
    if (opts.portrait) {
      portraitPath = resolve(opts.portrait);
      if (!existsSync(portraitPath)) {
        errorBox(`Portrait not found: ${portraitPath}`);
        process.exit(1);
      }
    }

    if (opts.transport === "sse") {
      console.log("");
      console.log(`  ${info} ${chalk.bold("Athanor MCP Server")} (SSE on port ${opts.port})`);
      console.log("");
    }

    try {
      const { startMcpServer } = await import("@athanor/mcp-server");

      await startMcpServer({
        transport: opts.transport as "stdio" | "sse",
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
          "MCP server package not found",
          "Install @athanor/mcp-server: pnpm install",
        );
      } else {
        errorBox(err instanceof Error ? err.message : String(err));
      }
      process.exit(1);
    }
  });
