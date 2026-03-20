"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { PortraitJSON, Chunk, FilterState, ViewMode } from "./types";

interface PortraitContextValue {
  portrait: PortraitJSON | null;
  loading: boolean;
  error: string | null;
  selectedChunkId: string | null;
  selectChunk: (id: string | null) => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  filteredChunks: Chunk[];
  clusters: string[];
  types: string[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  reload: () => void;
}

const PortraitContext = createContext<PortraitContextValue | null>(null);

export function usePortrait(): PortraitContextValue {
  const ctx = useContext(PortraitContext);
  if (!ctx) throw new Error("usePortrait must be inside PortraitProvider");
  return ctx;
}

export function PortraitProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: PortraitJSON;
}) {
  const [portrait, setPortrait] = useState<PortraitJSON | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [filters, setFilters] = useState<FilterState>({
    cluster: null,
    type: null,
    uniqueness: null,
    search: "",
  });

  const fetchPortrait = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portrait");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPortrait(data);
    } catch (e) {
      // Fallback to demo data
      try {
        const res = await fetch("/demo-portrait.json");
        if (!res.ok) throw new Error("Failed to load demo portrait");
        const data = await res.json();
        setPortrait(data);
      } catch {
        setError(e instanceof Error ? e.message : "Failed to load portrait");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) fetchPortrait();
  }, [initialData, fetchPortrait]);

  const clusters = portrait
    ? [...new Set(portrait.chunks.map((c) => c.cluster))].sort()
    : [];

  const types = portrait
    ? [...new Set(portrait.chunks.map((c) => c.type))].sort()
    : [];

  const filteredChunks = portrait
    ? portrait.chunks.filter((chunk) => {
        if (filters.cluster && chunk.cluster !== filters.cluster) return false;
        if (filters.type && chunk.type !== filters.type) return false;
        if (filters.uniqueness && chunk.uniqueness !== filters.uniqueness) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          return (
            chunk.content.toLowerCase().includes(q) ||
            chunk.chunk_id.toLowerCase().includes(q) ||
            chunk.context_tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      })
    : [];

  return (
    <PortraitContext.Provider
      value={{
        portrait,
        loading,
        error,
        selectedChunkId,
        selectChunk: setSelectedChunkId,
        filters,
        setFilters,
        filteredChunks,
        clusters,
        types,
        viewMode,
        setViewMode,
        reload: fetchPortrait,
      }}
    >
      {children}
    </PortraitContext.Provider>
  );
}
