#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createMcpServer } from "./server.js";
import { loadMcpConfig, type McpServerConfig } from "./config.js";

export { createMcpServer } from "./server.js";
export { loadMcpConfig, type McpServerConfig } from "./config.js";

export async function startMcpServer(
  overrides: Partial<McpServerConfig> = {},
): Promise<void> {
  const config = loadMcpConfig(overrides);
  const { server, init } = createMcpServer(config);

  await init();

  if (config.transport === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    await startSseServer(server, config.port);
  }
}

async function startSseServer(
  mcpServer: ReturnType<typeof createMcpServer>["server"],
  port: number,
): Promise<void> {
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (req.method === "GET" && url.pathname === "/sse") {
        const transport = new SSEServerTransport("/messages", res);
        transports.set(transport.sessionId, transport);

        transport.onclose = () => {
          transports.delete(transport.sessionId);
        };

        await mcpServer.connect(transport);
        return;
      }

      if (req.method === "POST" && url.pathname === "/messages") {
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
          return;
        }

        const transport = transports.get(sessionId)!;
        await transport.handlePostMessage(req, res);
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", transport: "sse" }));
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    },
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      const msg = `Athanor MCP server (SSE) listening on http://localhost:${port}`;
      process.stderr.write(`${msg}\n`);
      resolve();
    });
  });
}

// CLI entry point
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/athanor-mcp") ||
    process.argv[1].endsWith("/index.js") ||
    process.argv[1].endsWith("/index.ts"));

if (isDirectRun) {
  // Parse simple CLI args
  const args = process.argv.slice(2);
  const overrides: Partial<McpServerConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--transport" && next) {
      overrides.transport = next as "stdio" | "sse";
      i++;
    } else if (arg === "--port" && next) {
      overrides.port = parseInt(next, 10);
      i++;
    } else if (arg === "--portrait" && next) {
      overrides.portraitPath = next;
      i++;
    }
  }

  startMcpServer(overrides).catch((err) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
