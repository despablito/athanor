import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const CLI = join(import.meta.dirname, "../bin/athanor.ts");
const EXAMPLE_PORTRAIT = join(
  import.meta.dirname,
  "../../../../examples/portraits/fictional-cto/portrait.json",
);

const run = (args: string[]) =>
  execFileSync("npx", ["tsx", CLI, ...args], {
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" },
  });

describe("athanor stats", () => {
  it("displays basic stats for the example portrait", () => {
    const output = run(["stats", "--portrait", EXAMPLE_PORTRAIT]);

    expect(output).toContain("Portrait Stats");
    expect(output).toContain("Chunks by cluster:");
    expect(output).toContain("Chunks by type:");
    expect(output).toContain("Chunks by uniqueness:");
    expect(output).toContain("Relations by type:");
    expect(output).toContain("Total chunks:");
    expect(output).toContain("Total relations:");
  });

  it("shows centrality analysis", () => {
    const output = run(["stats", "--portrait", EXAMPLE_PORTRAIT, "--centrality"]);

    expect(output).toContain("Top 10 Most Connected Chunks");
  });

  it("shows tensions", () => {
    const output = run(["stats", "--portrait", EXAMPLE_PORTRAIT, "--tensions"]);

    expect(output).toContain("Tensions (CONTRASTS_WITH)");
  });

  it("shows learning chains", () => {
    const output = run([
      "stats",
      "--portrait",
      EXAMPLE_PORTRAIT,
      "--learning-chains",
    ]);

    expect(output).toContain("Learning Chains (LEARNED_FROM)");
  });
});
