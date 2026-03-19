import type { GraphStore } from "./graph-types.js";
import { PostgresGraphStore } from "./postgres-graph.js";
import { SqliteGraphStore } from "./sqlite-graph.js";

/** Map `sqlite://path` to `file:path` for `@libsql/client`. */
export function normalizeLibsqlUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("sqlite://")) {
    return "file:" + u.slice("sqlite://".length);
  }
  return u;
}

/**
 * Factory for graph stores.
 * - `postgres://` / `postgresql://` → {@link PostgresGraphStore} (Apache AGE + pgvector)
 * - `file:` / `sqlite:` / `libsql:` → {@link SqliteGraphStore} (local libSQL)
 */
export function createGraphStore(
  connectionString: string,
  graphName: string = "athanor",
): GraphStore {
  const u = connectionString.trim();
  if (u.startsWith("postgres://") || u.startsWith("postgresql://")) {
    return new PostgresGraphStore(connectionString, graphName);
  }
  if (
    u.startsWith("file:") ||
    u.startsWith("sqlite:") ||
    u.startsWith("libsql:")
  ) {
    return new SqliteGraphStore(normalizeLibsqlUrl(u));
  }
  throw new Error(
    `Unsupported database URL "${u}". Use postgres://, file:, sqlite://, or libsql://.`,
  );
}
