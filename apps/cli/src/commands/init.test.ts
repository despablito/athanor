import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(import.meta.dirname, "../bin/athanor.ts");
const run = (args: string[], cwd?: string) =>
  execFileSync("npx", ["tsx", CLI, ...args], {
    encoding: "utf-8",
    cwd: cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: "1" },
  });

describe("athanor init", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `athanor-test-init-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a valid skeleton portrait.json", () => {
    const outputDir = join(tmpDir, "my-portrait");

    run(["init", "Jan Kowalski", "--output", outputDir]);

    const portraitPath = join(outputDir, "portrait.json");
    expect(existsSync(portraitPath)).toBe(true);

    const portrait = JSON.parse(readFileSync(portraitPath, "utf-8"));
    expect(portrait.version).toBe("1.0.0-draft");
    expect(portrait.subject.name).toBe("Jan Kowalski");
    expect(portrait.subject.id).toBe("jan-kowalski");
    expect(portrait.chunks).toEqual([]);
    expect(portrait.relations).toEqual([]);
    expect(portrait.metadata.completeness_score).toBe(0);
    expect(portrait.metadata.chunk_count).toBe(0);
    expect(portrait.metadata.relation_count).toBe(0);
    expect(portrait.metadata.cluster_coverage).toEqual({});
    expect(portrait.created_at).toBeTruthy();
  });

  it("generates a slug id from special characters", () => {
    const outputDir = join(tmpDir, "special");

    run(["init", "María García-López", "--output", outputDir]);

    const portrait = JSON.parse(
      readFileSync(join(outputDir, "portrait.json"), "utf-8"),
    );
    expect(portrait.subject.id).toBe("mar-a-garc-a-l-pez");
    expect(portrait.subject.name).toBe("María García-López");
  });

  it("refuses to overwrite existing portrait", () => {
    const outputDir = join(tmpDir, "existing");

    run(["init", "First", "--output", outputDir]);

    expect(() => {
      run(["init", "Second", "--output", outputDir]);
    }).toThrow();
  });
});
