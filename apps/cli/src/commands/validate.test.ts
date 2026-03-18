import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, rmSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(import.meta.dirname, "../bin/athanor.ts");
const EXAMPLE_PORTRAIT = join(
  import.meta.dirname,
  "../../../../examples/portraits/fictional-cto/portrait.json",
);

const run = (args: string[], cwd?: string) =>
  execFileSync("npx", ["tsx", CLI, ...args], {
    encoding: "utf-8",
    cwd: cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: "1" },
  });

describe("athanor validate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `athanor-test-validate-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("validates the example portrait successfully", () => {
    const output = run(["validate", "--portrait", EXAMPLE_PORTRAIT]);

    expect(output).toContain("Schema valid");
    expect(output).toContain("116 chunks");
    expect(output).toContain("267 relations");
    expect(output).toContain("Score:");
  });

  it("validates a skeleton portrait", () => {
    const portraitPath = join(tmpDir, "portrait.json");
    writeFileSync(
      portraitPath,
      JSON.stringify({
        version: "1.0.0-draft",
        subject: { name: "Test", id: "test" },
        created_at: new Date().toISOString(),
        chunks: [],
        relations: [],
        metadata: {
          completeness_score: 0,
          chunk_count: 0,
          relation_count: 0,
          cluster_coverage: {},
        },
      }),
    );

    const output = run(["validate", "--portrait", portraitPath]);
    expect(output).toContain("Schema valid");
    expect(output).toContain("0 chunks");
  });

  it("reports errors for invalid portrait", () => {
    const portraitPath = join(tmpDir, "bad.json");
    writeFileSync(portraitPath, JSON.stringify({ invalid: true }));

    expect(() => {
      run(["validate", "--portrait", portraitPath]);
    }).toThrow();
  });
});
