"use client";

import { useMemo } from "react";
import { usePortrait } from "@/lib/portrait-context";
import {
  TYPE_BADGE_COLORS,
  UNIQUENESS_BADGE_COLORS,
  RELATION_COLORS,
} from "@/lib/colors";

export default function ChunkDetail() {
  const { portrait, selectedChunkId, selectChunk } = usePortrait();

  const chunk = useMemo(() => {
    if (!portrait || !selectedChunkId) return null;
    return portrait.chunks.find((c) => c.chunk_id === selectedChunkId) ?? null;
  }, [portrait, selectedChunkId]);

  const connections = useMemo(() => {
    if (!portrait || !selectedChunkId) return { incoming: [], outgoing: [] };

    const incoming = portrait.relations
      .filter((r) => r.target === selectedChunkId)
      .map((r) => ({
        relation: r,
        chunk: portrait.chunks.find((c) => c.chunk_id === r.source),
      }));

    const outgoing = portrait.relations
      .filter((r) => r.source === selectedChunkId)
      .map((r) => ({
        relation: r,
        chunk: portrait.chunks.find((c) => c.chunk_id === r.target),
      }));

    return { incoming, outgoing };
  }, [portrait, selectedChunkId]);

  if (!chunk) {
    return (
      <div className="flex items-center justify-center h-full text-[--text-dim] text-sm">
        Select a node to view details
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-accent-blue text-sm">{chunk.chunk_id}</div>
          <div className="text-[--text-secondary] text-xs mt-0.5">{chunk.cluster}</div>
        </div>
        <button
          onClick={() => selectChunk(null)}
          className="text-[--text-dim] hover:text-[--text-primary] text-lg leading-none px-1"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="badge"
          style={{
            backgroundColor: `${TYPE_BADGE_COLORS[chunk.type] ?? "#666"}20`,
            color: TYPE_BADGE_COLORS[chunk.type] ?? "#888",
          }}
        >
          {chunk.type}
        </span>
        <span
          className="badge"
          style={{
            backgroundColor: `${UNIQUENESS_BADGE_COLORS[chunk.uniqueness] ?? "#666"}20`,
            color: UNIQUENESS_BADGE_COLORS[chunk.uniqueness] ?? "#888",
          }}
        >
          {chunk.uniqueness}
        </span>
        <span className="badge bg-surface-3 text-[--text-secondary]">
          {(chunk.confidence * 100).toFixed(0)}% conf
        </span>
        <span className="badge bg-surface-3 text-[--text-secondary]">
          {chunk.source}
        </span>
      </div>

      {/* Content */}
      <div className="text-sm leading-relaxed">{chunk.content}</div>

      {/* Tags */}
      {chunk.context_tags.length > 0 && (
        <div>
          <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-2">Tags</div>
          <div className="flex flex-wrap gap-1">
            {chunk.context_tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-surface-3 rounded text-xs font-mono text-[--text-secondary]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      {(connections.outgoing.length > 0 || connections.incoming.length > 0) && (
        <div>
          <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-2">
            Connections ({connections.outgoing.length + connections.incoming.length})
          </div>

          {connections.outgoing.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <div className="text-[--text-dim] text-[10px] uppercase">Outgoing</div>
              {connections.outgoing.map(({ relation, chunk: target }) => (
                <button
                  key={`${relation.source}-${relation.target}-${relation.type}`}
                  onClick={() => target && selectChunk(target.chunk_id)}
                  className="w-full text-left p-2 bg-surface-2 rounded hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: RELATION_COLORS[relation.type] ?? "#888" }}
                    >
                      {relation.type}
                    </span>
                    <span className="text-[--text-dim]">→</span>
                    <span className="font-mono text-xs text-accent-blue">
                      {relation.target}
                    </span>
                  </div>
                  {relation.description && (
                    <div className="text-[--text-dim] text-[11px] mt-0.5 line-clamp-2">
                      {relation.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {connections.incoming.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[--text-dim] text-[10px] uppercase">Incoming</div>
              {connections.incoming.map(({ relation, chunk: source }) => (
                <button
                  key={`${relation.source}-${relation.target}-${relation.type}`}
                  onClick={() => source && selectChunk(source.chunk_id)}
                  className="w-full text-left p-2 bg-surface-2 rounded hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-accent-blue">
                      {relation.source}
                    </span>
                    <span className="text-[--text-dim]">→</span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: RELATION_COLORS[relation.type] ?? "#888" }}
                    >
                      {relation.type}
                    </span>
                  </div>
                  {relation.description && (
                    <div className="text-[--text-dim] text-[11px] mt-0.5 line-clamp-2">
                      {relation.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
