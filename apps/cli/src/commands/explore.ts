import { Command } from "commander";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import chalk from "chalk";
import { errorBox, successBox } from "../lib/ui.js";

interface ExploreOpts {
  portrait?: string;
  port: string;
}

export const exploreCommand = new Command("explore")
  .description("Launch the portrait explorer (Next.js)")
  .option("--portrait <path>", "Portrait JSON file to load")
  .option("--port <port>", "Dev server port", "4000")
  .action(async (opts: ExploreOpts) => {
    // Resolve portrait path
    let portraitPath: string | undefined;
    if (opts.portrait) {
      portraitPath = resolve(opts.portrait);
      if (!existsSync(portraitPath)) {
        errorBox(`Portrait not found: ${portraitPath}`);
        process.exit(1);
      }
    }

    // Find the explorer app directory
    const explorerDir = findExplorerDir();
    if (!explorerDir) {
      errorBox(
        "Explorer app not found",
        "The @athanor/explorer package must be installed in the monorepo.",
      );
      process.exit(1);
    }

    console.log("");
    successBox(`Starting Athanor Explorer on port ${chalk.cyan(opts.port)}`);
    if (portraitPath) {
      successBox(`Portrait: ${chalk.dim(portraitPath)}`);
    }
    console.log("");

    // Set env and launch Next.js dev server
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      PORT: opts.port,
    };
    if (portraitPath) {
      env.ATHANOR_PORTRAIT_PATH = portraitPath;
    }

    const child = spawn("npx", ["next", "dev", "--port", opts.port], {
      cwd: explorerDir,
      env,
      stdio: "inherit",
      shell: true,
    });

    // Open browser after a brief delay
    setTimeout(() => {
      const url = `http://localhost:${opts.port}`;
      try {
        const platform = process.platform;
        if (platform === "darwin") execSync(`open ${url}`);
        else if (platform === "win32") execSync(`start ${url}`);
        else execSync(`xdg-open ${url} 2>/dev/null || true`);
      } catch {
        console.log(`  ${chalk.dim(`Open ${chalk.cyan(url)} in your browser`)}`);
      }
    }, 2000);

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });

    // Forward signals
    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));
  });

function findExplorerDir(): string | null {
  // Try common monorepo locations
  const candidates = [
    resolve(process.cwd(), "apps", "explorer"),
    resolve(process.cwd(), "..", "explorer"),
    resolve(process.cwd(), "..", "..", "apps", "explorer"),
  ];

  for (const dir of candidates) {
    if (existsSync(resolve(dir, "package.json"))) {
      return dir;
    }
  }

  // Try to find via package.json name
  try {
    const result = execSync("pnpm ls --json --filter @athanor/explorer 2>/dev/null", {
      encoding: "utf-8",
      cwd: resolve(process.cwd()),
    });
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed) && parsed[0]?.path) {
      return parsed[0].path;
    }
  } catch {
    // Ignore
  }

  return null;
}
