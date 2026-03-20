import { describe, expect, it } from "vitest";
import { stripDoubleDashBeforeSubcommand } from "./cli-argv.js";

describe("stripDoubleDashBeforeSubcommand", () => {
  it("removes pnpm-style -- before a top-level subcommand", () => {
    const argv = [
      "/opt/homebrew/bin/node",
      "/path/tsx",
      "/path/athanor.ts",
      "--",
      "chat",
      "--provider",
      "anthropic",
    ];
    expect(stripDoubleDashBeforeSubcommand(argv)).toEqual([
      "/opt/homebrew/bin/node",
      "/path/tsx",
      "/path/athanor.ts",
      "chat",
      "--provider",
      "anthropic",
    ]);
  });

  it("does not remove -- when the next token is not a subcommand", () => {
    const argv = ["node", "script.js", "--", "--help"];
    expect(stripDoubleDashBeforeSubcommand(argv)).toEqual(argv);
  });
});
