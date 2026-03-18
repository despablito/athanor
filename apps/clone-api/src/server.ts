import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { PortraitStore } from "./portrait-store.js";
import { CloneEngine, type ChatRequest } from "./clone.js";
import type { CloneApiConfig } from "./config.js";


export interface AppContext {
  store: PortraitStore;
  engine: CloneEngine;
  config: CloneApiConfig;
}

export function createApp(ctx: AppContext): Hono {
  const app = new Hono();

  app.use("*", cors());
  app.use("*", logger());

  // ─── Health ────────────────────────────────────────────────────────────────

  app.get("/", (c) =>
    c.json({
      status: "ok",
      service: "athanor-clone-api",
      portraits: ctx.store.list().length,
    }),
  );

  // ─── POST /api/clone/:portraitId/chat ──────────────────────────────────────

  app.post("/api/clone/:portraitId/chat", async (c) => {
    const { portraitId } = c.req.param();
    const portrait = ctx.store.get(portraitId);
    if (!portrait) {
      return c.json({ error: `Portrait not found: ${portraitId}` }, 404);
    }

    let body: ChatRequest;
    try {
      body = await c.req.json<ChatRequest>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    if (!body.message || typeof body.message !== "string") {
      return c.json({ error: "Field 'message' is required and must be a string" }, 400);
    }

    try {
      const response = await ctx.engine.chat(portraitId, body);
      return c.json(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: `Chat failed: ${msg}` }, 500);
    }
  });

  // ─── GET /api/portraits ────────────────────────────────────────────────────

  app.get("/api/portraits", (c) => {
    return c.json({ portraits: ctx.store.list() });
  });

  // ─── GET /api/portraits/:id ────────────────────────────────────────────────

  app.get("/api/portraits/:id", (c) => {
    const { id } = c.req.param();
    const portrait = ctx.store.get(id);
    if (!portrait) {
      return c.json({ error: `Portrait not found: ${id}` }, 404);
    }
    return c.json(portrait);
  });

  // ─── GET /api/portraits/:id/stats ──────────────────────────────────────────

  app.get("/api/portraits/:id/stats", (c) => {
    const { id } = c.req.param();
    const portrait = ctx.store.get(id);
    if (!portrait) {
      return c.json({ error: `Portrait not found: ${id}` }, 404);
    }

    // Compute stats from the portrait data
    // We need to compute stats manually since Portrait auto-generates IDs
    const types: Record<string, number> = {};
    const uniqueness: Record<string, number> = {};
    let totalConf = 0;

    for (const chunk of portrait.chunks) {
      types[chunk.type] = (types[chunk.type] ?? 0) + 1;
      uniqueness[chunk.uniqueness] = (uniqueness[chunk.uniqueness] ?? 0) + 1;
      totalConf += chunk.confidence;
    }

    const criticalCount = uniqueness["CRITICAL"] ?? 0;

    return c.json({
      chunk_count: portrait.chunks.length,
      relation_count: portrait.relations.length,
      clusters: portrait.metadata.cluster_coverage,
      types,
      uniqueness,
      critical_ratio: portrait.chunks.length > 0 ? criticalCount / portrait.chunks.length : 0,
      avg_confidence: portrait.chunks.length > 0 ? totalConf / portrait.chunks.length : 0,
      completeness_score: portrait.metadata.completeness_score,
    });
  });

  // ─── GET /api/portraits/:id/chunks ─────────────────────────────────────────

  app.get("/api/portraits/:id/chunks", (c) => {
    const { id } = c.req.param();
    const portrait = ctx.store.get(id);
    if (!portrait) {
      return c.json({ error: `Portrait not found: ${id}` }, 404);
    }

    // Optional filters
    const cluster = c.req.query("cluster");
    const type = c.req.query("type");
    const uniquenessFilter = c.req.query("uniqueness");
    const search = c.req.query("search");
    const limitStr = c.req.query("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    let chunks = portrait.chunks;

    if (cluster) {
      chunks = chunks.filter((ch) => ch.cluster === cluster);
    }
    if (type) {
      chunks = chunks.filter((ch) => ch.type === type);
    }
    if (uniquenessFilter) {
      chunks = chunks.filter((ch) => ch.uniqueness === uniquenessFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      chunks = chunks.filter(
        (ch) =>
          ch.content.toLowerCase().includes(q) ||
          (ch.chunk_id as string).toLowerCase().includes(q) ||
          ch.context_tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (limit && limit > 0) {
      chunks = chunks.slice(0, limit);
    }

    return c.json({ chunks, total: chunks.length });
  });

  // ─── GET /api/portraits/:id/chunks/:chunkId ───────────────────────────────

  app.get("/api/portraits/:id/chunks/:chunkId", (c) => {
    const { id, chunkId } = c.req.param();
    const chunk = ctx.store.getChunk(id, chunkId);
    if (!chunk) {
      return c.json({ error: `Chunk not found: ${chunkId}` }, 404);
    }

    // Find related chunks
    const portrait = ctx.store.get(id)!;
    const relatedOut = portrait.relations
      .filter((r) => (r.source as string) === chunkId)
      .map((r) => ({ type: r.type, target: r.target as string, description: r.description }));

    const relatedIn = portrait.relations
      .filter((r) => (r.target as string) === chunkId)
      .map((r) => ({ type: r.type, source: r.source as string, description: r.description }));

    return c.json({
      chunk,
      relations: { outgoing: relatedOut, incoming: relatedIn },
    });
  });

  return app;
}
