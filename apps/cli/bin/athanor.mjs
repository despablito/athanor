#!/usr/bin/env node
/**
 * Launcher for the CLI: prefer compiled dist/, fall back to tsx + source (dev).
 * Ensures `pnpm exec athanor` works once this file is linked in node_modules/.bin.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(pkgRoot, "dist", "bin", "athanor.js");
const srcEntry = join(pkgRoot, "src", "bin", "athanor.ts");
const args = process.argv.slice(2);

if (existsSync(distEntry)) {
  const r = spawnSync(process.execPath, [distEntry, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(r.status ?? 1);
}

const tsxCli = join(pkgRoot, "node_modules", "tsx", "dist", "cli.mjs");
if (existsSync(tsxCli)) {
  const r = spawnSync(process.execPath, [tsxCli, srcEntry, ...args], {
    stdio: "inherit",
    env: process.env,
    cwd: pkgRoot,
  });
  process.exit(r.status ?? 1);
}

const npx = spawnSync("npx", ["tsx", srcEntry, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: pkgRoot,
});
process.exit(npx.status ?? 1);
