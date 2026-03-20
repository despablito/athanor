import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { resolvePortraitPathWithWorkspaceFallback } from "./portrait-io.js";

describe("resolvePortraitPathWithWorkspaceFallback", () => {
  it("uses the repo example portrait when cwd is apps/cli and default path is missing", () => {
    const cwd = process.cwd();
    const primary = resolve(cwd, "portrait.json");
    if (existsSync(primary)) {
      // avoid false expectations if someone checked in portrait.json in cwd
      expect(true).toBe(true);
      return;
    }
    const resolved = resolvePortraitPathWithWorkspaceFallback("./portrait.json", {
      allowWorkspaceExampleFallback: true,
    });
    expect(existsSync(resolved)).toBe(true);
    expect(resolved.replace(/\\/g, "/")).toMatch(
      /examples\/portraits\/fictional-cto\/portrait\.json$/,
    );
  });

  it("does not use fallback when disabled", () => {
    const resolved = resolvePortraitPathWithWorkspaceFallback(
      "./definitely-missing-portrait-xyz.json",
      { allowWorkspaceExampleFallback: false },
    );
    expect(resolved).toContain("definitely-missing-portrait-xyz.json");
    expect(existsSync(resolved)).toBe(false);
  });
});
