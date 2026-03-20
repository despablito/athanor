import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(import.meta.dirname, "../bin/athanor.ts");
const EXAMPLE_PORTRAIT = join(
  import.meta.dirname,
  "../../../../examples/portraits/fictional-cto/portrait.json",
);

const run = (args: string[]) =>
  execFileSync("npx", ["tsx", CLI, ...args], {
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 10 * 1024 * 1024,
  });

const subprocessTimeoutMs = 60_000;

describe("athanor export", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `athanor-test-export-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    "exports to JSON format",
    () => {
      const output = join(tmpDir, "export.json");
      run(["export", "json", output, "--portrait", EXAMPLE_PORTRAIT]);

      expect(existsSync(output)).toBe(true);
      const data = JSON.parse(readFileSync(output, "utf-8"));
      expect(data.version).toBeTruthy();
      expect(data.chunks.length).toBeGreaterThan(0);
      expect(data.relations.length).toBeGreaterThan(0);
    },
    subprocessTimeoutMs,
  );

  it(
    "exports to Cypher format",
    () => {
      const output = join(tmpDir, "export.cypher");
      run(["export", "cypher", output, "--portrait", EXAMPLE_PORTRAIT]);

      expect(existsSync(output)).toBe(true);
      const content = readFileSync(output, "utf-8");
      expect(content).toContain("CREATE (:Chunk");
      expect(content).toContain("MATCH (a:Chunk");
    },
    subprocessTimeoutMs,
  );

  it(
    "exports to Markdown format",
    () => {
      const output = join(tmpDir, "export.md");
      run(["export", "markdown", output, "--portrait", EXAMPLE_PORTRAIT]);

      expect(existsSync(output)).toBe(true);
      const content = readFileSync(output, "utf-8");
      expect(content).toContain("# Portrait:");
      expect(content).toContain("## ");
      expect(content).toContain("**Relations:**");
    },
    subprocessTimeoutMs,
  );

  it(
    "exports to Obsidian vault",
    () => {
      const vaultDir = join(tmpDir, "vault");
      run(["export", "obsidian", vaultDir, "--portrait", EXAMPLE_PORTRAIT]);

      expect(existsSync(vaultDir)).toBe(true);
      const files = readdirSync(vaultDir);
      expect(files).toContain("Index.md");
      expect(files.length).toBeGreaterThan(10);

      // Check a chunk file has frontmatter
      const chunkFiles = files.filter((f) => f !== "Index.md" && f.endsWith(".md"));
      expect(chunkFiles.length).toBeGreaterThan(0);
      const firstChunk = readFileSync(join(vaultDir, chunkFiles[0]), "utf-8");
      expect(firstChunk).toContain("---");
      expect(firstChunk).toContain("chunk_id:");
    },
    subprocessTimeoutMs,
  );

  it(
    "rejects unknown format",
    () => {
      expect(() => {
        run(["export", "xml", join(tmpDir, "out.xml"), "--portrait", EXAMPLE_PORTRAIT]);
      }).toThrow();
    },
    subprocessTimeoutMs,
  );
});
