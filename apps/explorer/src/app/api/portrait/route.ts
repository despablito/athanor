import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export async function GET() {
  // Check for custom portrait path (set via env)
  const customPath = process.env.ATHANOR_PORTRAIT_PATH;

  if (customPath) {
    const resolved = resolve(customPath);
    if (existsSync(resolved)) {
      try {
        const data = await readFile(resolved, "utf-8");
        return NextResponse.json(JSON.parse(data));
      } catch (e) {
        return NextResponse.json(
          { error: `Failed to read portrait: ${e}` },
          { status: 500 },
        );
      }
    }
  }

  // Fallback: read demo portrait from public/
  const demoPath = resolve(process.cwd(), "public", "demo-portrait.json");
  if (existsSync(demoPath)) {
    try {
      const data = await readFile(demoPath, "utf-8");
      return NextResponse.json(JSON.parse(data));
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to read demo portrait: ${e}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "No portrait found. Set ATHANOR_PORTRAIT_PATH or place demo-portrait.json in public/." },
    { status: 404 },
  );
}
