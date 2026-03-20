/**
 * Side-effect module: loads the first `.env` found walking upward from
 * `process.cwd()`.
 *
 * Node does not read `.env` files automatically (unlike some hosts). Without
 * this, `ANTHROPIC_API_KEY` etc. in the repo-root `.env` are invisible when
 * `pnpm --filter @athanor/cli dev` runs with cwd `apps/cli`.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let dir = process.cwd();
for (let i = 0; i < 16; i++) {
  const envPath = resolve(dir, ".env");
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
  const parent = resolve(dir, "..");
  if (parent === dir) break;
  dir = parent;
}
