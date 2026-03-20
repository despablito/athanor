/**
 * Top-level athanor subcommands (must match `new Command("…")` names).
 * Used to fix argv when runners insert `--` before the subcommand (e.g. pnpm:
 * `tsx src/bin/athanor.ts -- chat --provider anthropic`).
 */
export const TOP_LEVEL_COMMANDS = new Set([
  "init",
  "import",
  "validate",
  "stats",
  "export",
  "db",
  "extract",
  "meta-generate",
  "clone-prompt",
  "embed",
  "explore",
  "serve",
  "mcp",
  "interview",
  "second-order",
  "chat",
  "red-team",
]);

/**
 * Commander treats `--` as “end of options”; a runner-inserted `--` before the
 * subcommand makes the subcommand see later tokens as positionals (e.g.
 * `--provider` and `anthropic` → “Expected 0 arguments but got 2”).
 *
 * Remove a standalone `--` only when the next token is a known top-level
 * subcommand name.
 */
export function stripDoubleDashBeforeSubcommand(argv: string[]): string[] {
  const out = [...argv];
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i] === "--" && TOP_LEVEL_COMMANDS.has(out[i + 1]!)) {
      out.splice(i, 1);
      break;
    }
  }
  return out;
}
