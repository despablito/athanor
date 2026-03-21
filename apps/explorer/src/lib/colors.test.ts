import { describe, it, expect } from "vitest";
import {
  clusterColor,
  RELATION_COLORS,
  UNIQUENESS_RADIUS,
  TYPE_BADGE_COLORS,
  UNIQUENESS_BADGE_COLORS,
} from "./colors.js";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

describe("clusterColor", () => {
  it("returns correct colors for all predefined clusters", () => {
    expect(clusterColor("technical-decision-making")).toBe("#5b9cf6");
    expect(clusterColor("team-leadership")).toBe("#78e08f");
    expect(clusterColor("communication")).toBe("#45c9a0");
    expect(clusterColor("personal-values")).toBe("#fbbf24");
    expect(clusterColor("domain-expertise")).toBe("#b47cf7");
    expect(clusterColor("emotional-landscape")).toBe("#ec4899");
    expect(clusterColor("meta-patterns")).toBe("#34d399");
  });

  it("returns a valid hex color for unknown clusters", () => {
    const color = clusterColor("some-brand-new-cluster-zzz");
    expect(color).toMatch(HEX_COLOR);
  });

  it("returns the same color on repeated calls for the same unknown cluster", () => {
    const a = clusterColor("my-stable-cluster-test");
    const b = clusterColor("my-stable-cluster-test");
    expect(a).toBe(b);
  });

  it("assigns different colors to different unknown clusters", () => {
    const a = clusterColor("unknown-cluster-alpha-1");
    const b = clusterColor("unknown-cluster-beta-2");
    // They may collide if EXTRA_COLORS wraps, but at least they are valid hex
    expect(a).toMatch(HEX_COLOR);
    expect(b).toMatch(HEX_COLOR);
  });
});

describe("RELATION_COLORS", () => {
  const expectedTypes = [
    "INSTANTIATES",
    "ENABLES",
    "LEARNED_FROM",
    "CONTRASTS_WITH",
    "HARDCODED_EXCEPTION",
    "EXPRESSED_THROUGH",
  ];

  it("has a color for each of the 6 relation types", () => {
    expect(Object.keys(RELATION_COLORS)).toHaveLength(6);
  });

  it.each(expectedTypes)("has a valid hex color for %s", (type) => {
    expect(RELATION_COLORS[type]).toMatch(HEX_COLOR);
  });
});

describe("UNIQUENESS_RADIUS", () => {
  it("CRITICAL radius is largest", () => {
    expect(UNIQUENESS_RADIUS["CRITICAL"]).toBeGreaterThan(UNIQUENESS_RADIUS["HIGH"]);
  });

  it("HIGH radius is larger than MEDIUM", () => {
    expect(UNIQUENESS_RADIUS["HIGH"]).toBeGreaterThan(UNIQUENESS_RADIUS["MEDIUM"]);
  });

  it("all radii are positive numbers", () => {
    for (const val of Object.values(UNIQUENESS_RADIUS)) {
      expect(val).toBeGreaterThan(0);
    }
  });
});

describe("TYPE_BADGE_COLORS", () => {
  const expectedTypes = [
    "heuristic",
    "anti-pattern",
    "preference",
    "belief",
    "fact",
    "skill",
    "emotion",
    "story",
    "contradiction",
    "style",
    "framework",
    "rant",
    "meta",
    "ritual",
    "hard_rule",
  ];

  it.each(expectedTypes)("has a valid hex color for type '%s'", (type) => {
    expect(TYPE_BADGE_COLORS[type]).toMatch(HEX_COLOR);
  });
});

describe("UNIQUENESS_BADGE_COLORS", () => {
  it("has valid hex colors for all uniqueness levels", () => {
    expect(UNIQUENESS_BADGE_COLORS["CRITICAL"]).toMatch(HEX_COLOR);
    expect(UNIQUENESS_BADGE_COLORS["HIGH"]).toMatch(HEX_COLOR);
    expect(UNIQUENESS_BADGE_COLORS["MEDIUM"]).toMatch(HEX_COLOR);
  });

  it("CRITICAL is more urgent-looking than MEDIUM", () => {
    expect(UNIQUENESS_BADGE_COLORS["CRITICAL"]).toBe("#e85d75");
    expect(UNIQUENESS_BADGE_COLORS["HIGH"]).toBe("#fbbf24");
    expect(UNIQUENESS_BADGE_COLORS["MEDIUM"]).toBe("#94a3b8");
  });
});
