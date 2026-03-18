"use client";

import { usePortrait } from "@/lib/portrait-context";

export default function FilterBar() {
  const { portrait, filters, setFilters, clusters, types, filteredChunks } =
    usePortrait();

  if (!portrait) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface-1 border-b border-[--border] flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search chunks…"
          className="w-full bg-surface-2 border border-[--border] rounded px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-dim] focus:outline-none focus:border-accent-blue"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ ...filters, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-dim] hover:text-[--text-primary] text-sm"
          >
            ×
          </button>
        )}
      </div>

      {/* Cluster filter */}
      <select
        value={filters.cluster ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, cluster: e.target.value || null })
        }
        className="bg-surface-2 border border-[--border] rounded px-2 py-1.5 text-sm text-[--text-secondary] focus:outline-none focus:border-accent-blue"
      >
        <option value="">All clusters</option>
        {clusters.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={filters.type ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, type: e.target.value || null })
        }
        className="bg-surface-2 border border-[--border] rounded px-2 py-1.5 text-sm text-[--text-secondary] focus:outline-none focus:border-accent-blue"
      >
        <option value="">All types</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Uniqueness filter */}
      <select
        value={filters.uniqueness ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, uniqueness: e.target.value || null })
        }
        className="bg-surface-2 border border-[--border] rounded px-2 py-1.5 text-sm text-[--text-secondary] focus:outline-none focus:border-accent-blue"
      >
        <option value="">All uniqueness</option>
        <option value="CRITICAL">CRITICAL</option>
        <option value="HIGH">HIGH</option>
        <option value="MEDIUM">MEDIUM</option>
      </select>

      {/* Result count */}
      <div className="text-xs text-[--text-dim] font-mono ml-auto">
        {filteredChunks.length}/{portrait.chunks.length} chunks
      </div>

      {/* Clear all */}
      {(filters.cluster || filters.type || filters.uniqueness || filters.search) && (
        <button
          onClick={() =>
            setFilters({ cluster: null, type: null, uniqueness: null, search: "" })
          }
          className="text-xs text-[--text-dim] hover:text-accent-blue transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
