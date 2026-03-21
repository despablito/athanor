import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must be hoisted before imports that use these modules
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data: unknown, init?: { status?: number }) => ({
      _data: data,
      _status: init?.status ?? 200,
    })),
  },
}));

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { GET } from "./route.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFile = vi.mocked(readFile);

const SAMPLE_PORTRAIT = {
  version: "1.0.0-draft",
  subject: { name: "Jan", id: "jan" },
  created_at: "2025-01-01T00:00:00Z",
  chunks: [],
  relations: [],
  metadata: { completeness_score: 0.5, chunk_count: 0, relation_count: 0, cluster_coverage: {} },
};

describe("GET /api/portrait", () => {
  const originalEnv = process.env["ATHANOR_PORTRAIT_PATH"];

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env["ATHANOR_PORTRAIT_PATH"];
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["ATHANOR_PORTRAIT_PATH"] = originalEnv;
    } else {
      delete process.env["ATHANOR_PORTRAIT_PATH"];
    }
  });

  it("returns portrait from ATHANOR_PORTRAIT_PATH when file exists", async () => {
    process.env["ATHANOR_PORTRAIT_PATH"] = "/custom/portrait.json";
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(SAMPLE_PORTRAIT) as unknown as Buffer);

    const response = await GET() as unknown as { _data: unknown; _status: number };

    expect(response._status).toBe(200);
    expect(response._data).toEqual(SAMPLE_PORTRAIT);
  });

  it("reads portrait file exactly once when custom path is valid", async () => {
    process.env["ATHANOR_PORTRAIT_PATH"] = "/custom/portrait.json";
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(SAMPLE_PORTRAIT) as unknown as Buffer);

    await GET();

    expect(mockReadFile).toHaveBeenCalledTimes(1);
  });

  it("falls back to demo-portrait.json when ATHANOR_PORTRAIT_PATH is not set", async () => {
    const demoPortrait = { ...SAMPLE_PORTRAIT, subject: { name: "Demo", id: "demo" } };
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(demoPortrait) as unknown as Buffer);

    const response = await GET() as unknown as { _data: unknown; _status: number };

    expect(response._status).toBe(200);
    expect(response._data).toEqual(demoPortrait);
  });

  it("falls back to demo-portrait.json when custom path file does not exist", async () => {
    process.env["ATHANOR_PORTRAIT_PATH"] = "/missing/portrait.json";
    const demoPortrait = { ...SAMPLE_PORTRAIT, subject: { name: "Demo", id: "demo" } };
    // First call (custom path) → false, second call (demo path) → true
    mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockReadFile.mockResolvedValue(JSON.stringify(demoPortrait) as unknown as Buffer);

    const response = await GET() as unknown as { _data: unknown; _status: number };

    expect(response._status).toBe(200);
    expect(response._data).toEqual(demoPortrait);
  });

  it("returns 404 when no portrait is found at all", async () => {
    mockExistsSync.mockReturnValue(false);

    const response = await GET() as unknown as { _data: { error: string }; _status: number };

    expect(response._status).toBe(404);
    expect(response._data.error).toContain("No portrait found");
  });

  it("returns 500 when custom portrait file cannot be read", async () => {
    process.env["ATHANOR_PORTRAIT_PATH"] = "/unreadable/portrait.json";
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error("Permission denied"));

    const response = await GET() as unknown as { _data: { error: string }; _status: number };

    expect(response._status).toBe(500);
    expect(response._data.error).toContain("Failed to read portrait");
  });

  it("returns 500 when demo portrait file cannot be read", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error("Corrupt file"));

    const response = await GET() as unknown as { _data: { error: string }; _status: number };

    expect(response._status).toBe(500);
  });

  it("parses portrait JSON and returns object (not raw string)", async () => {
    process.env["ATHANOR_PORTRAIT_PATH"] = "/my/portrait.json";
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(SAMPLE_PORTRAIT) as unknown as Buffer);

    const response = await GET() as unknown as { _data: unknown; _status: number };

    // Must be parsed object, not a JSON string
    expect(typeof response._data).toBe("object");
    expect(response._data).not.toBeNull();
  });
});
