"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import * as d3 from "d3";
import { usePortrait } from "@/lib/portrait-context";
import {
  clusterColor,
  RELATION_COLORS,
  UNIQUENESS_RADIUS,
  META_RADIUS,
} from "@/lib/colors";
import type { Chunk, Relation } from "@/lib/types";

/* ── Simulation node / link ────────────────────────────────────── */

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  chunk: Chunk;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: Relation;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function nodeRadius(chunk: Chunk): number {
  if (chunk.type === "meta") return META_RADIUS;
  return UNIQUENESS_RADIUS[chunk.uniqueness] ?? 7;
}

function nodeFillOpacity(chunk: Chunk): number {
  if (chunk.type === "meta") return 0.3;
  if (chunk.cluster.includes("identity")) return 0.28;
  return 0.18;
}

function nodeStroke(chunk: Chunk): { color: string; width: number; dash: string } {
  const base = clusterColor(chunk.cluster);
  if (chunk.type === "meta") return { color: "#34d399", width: 2, dash: "" };
  if (chunk.type === "emotion") return { color: "#fbbf24", width: 1.8, dash: "" };
  if (chunk.cluster.includes("identity")) return { color: base, width: 1.5, dash: "4 2" };
  if (chunk.cluster.includes("historical")) return { color: "#94a3b8", width: 1.5, dash: "6 2" };
  return { color: base, width: 1.2, dash: "" };
}

/** Strip common prefix from chunk_id for short labels */
function shortLabel(id: string): string {
  // e.g. "TDM-HEUR-001" → "HEUR-001"
  const parts = id.split("-");
  return parts.length > 2 ? parts.slice(1).join("-") : id;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const {
    portrait,
    filteredChunks,
    selectedChunkId,
    selectChunk,
    viewMode,
  } = usePortrait();
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [graphSearch, setGraphSearch] = useState("");

  /* ── Build graph ───────────────────────────────────────────── */

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !portrait) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    const filteredIds = new Set(filteredChunks.map((c) => c.chunk_id));

    const nodes: SimNode[] = filteredChunks.map((chunk) => ({
      id: chunk.chunk_id,
      chunk,
    }));

    const links: SimLink[] = portrait.relations
      .filter((r) => filteredIds.has(r.source) && filteredIds.has(r.target))
      .map((relation) => ({
        source: relation.source,
        target: relation.target,
        relation,
      }));

    /* ── Force simulation ─────────────────────────────────── */

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) =>
            d.relation.type === "EXPRESSED_THROUGH" ? 52 : 84,
          )
          .strength(0.26),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius(26),
      );

    // Custom cluster gravity force
    simulation.force("clusterGravity", (alpha: number) => {
      // Compute cluster centroids
      const centroids: Record<string, { x: number; y: number; count: number }> = {};
      for (const node of nodes) {
        const c = node.chunk.cluster;
        if (!centroids[c]) centroids[c] = { x: 0, y: 0, count: 0 };
        centroids[c].x += node.x ?? 0;
        centroids[c].y += node.y ?? 0;
        centroids[c].count++;
      }
      for (const key of Object.keys(centroids)) {
        const c = centroids[key];
        c.x /= c.count;
        c.y /= c.count;
      }
      // Nudge each node toward its cluster centroid
      const k = alpha * 0.08;
      for (const node of nodes) {
        const c = centroids[node.chunk.cluster];
        if (c) {
          node.vx = (node.vx ?? 0) + (c.x - (node.x ?? 0)) * k;
          node.vy = (node.vy ?? 0) + (c.y - (node.y ?? 0)) * k;
        }
      }
    });

    simulationRef.current = simulation;

    /* ── SVG structure ────────────────────────────────────── */

    const defs = svg.append("defs");

    // Arrow markers for each relation type
    for (const [type, color] of Object.entries(RELATION_COLORS)) {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5");
    }

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Click empty space to deselect
    svg.on("click", (event) => {
      if (event.target === svgRef.current) {
        selectChunk(null);
      }
    });

    /* ── Edges ────────────────────────────────────────────── */

    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => RELATION_COLORS[d.relation.type] ?? "#333")
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", (d) => 0.5 + (d.relation.weight ?? 0.5))
      .attr("stroke-dasharray", (d) =>
        d.relation.type === "EXPRESSED_THROUGH" ? "5 3" : "",
      )
      .attr("marker-end", (d) => `url(#arrow-${d.relation.type})`)
      .style("transition", "opacity 0.15s ease");

    // Relation labels (hidden by default, shown via viewMode)
    const linkLabel = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", "8px")
      .attr("fill", (d) => RELATION_COLORS[d.relation.type] ?? "#555")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("opacity", 0)
      .text((d) => d.relation.type);

    /* ── Nodes ────────────────────────────────────────────── */

    const nodeGroup = g.append("g").attr("class", "nodes");

    // CRITICAL outer ring
    nodeGroup
      .selectAll("circle.critical-ring")
      .data(nodes.filter((n) => n.chunk.uniqueness === "CRITICAL"))
      .join("circle")
      .attr("class", "critical-ring")
      .attr("r", (d) => nodeRadius(d.chunk) + 3)
      .attr("fill", "none")
      .attr("stroke", (d) => clusterColor(d.chunk.cluster))
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 2")
      .attr("pointer-events", "none");

    // Meta outer ring
    nodeGroup
      .selectAll("circle.meta-ring")
      .data(nodes.filter((n) => n.chunk.type === "meta"))
      .join("circle")
      .attr("class", "meta-ring")
      .attr("r", (d) => nodeRadius(d.chunk) + 5)
      .attr("fill", "none")
      .attr("stroke", "#34d399")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 2")
      .attr("pointer-events", "none");

    // Main node circles
    const node = nodeGroup
      .selectAll("circle.node")
      .data(nodes)
      .join("circle")
      .attr("class", "node")
      .attr("r", (d) => nodeRadius(d.chunk))
      .attr("fill", (d) => {
        const color = clusterColor(d.chunk.cluster);
        return color + Math.round(nodeFillOpacity(d.chunk) * 255).toString(16).padStart(2, "0");
      })
      .attr("stroke", (d) => nodeStroke(d.chunk).color)
      .attr("stroke-width", (d) => nodeStroke(d.chunk).width)
      .attr("stroke-dasharray", (d) => nodeStroke(d.chunk).dash)
      .attr("cursor", "pointer")
      .style("transition", "opacity 0.15s ease")
      .on("click", (event, d) => {
        event.stopPropagation();
        selectChunk(selectedChunkId === d.id ? null : d.id);
      })
      .on("mouseenter", (event, d) => {
        if (!tooltipRef.current) return;
        const tooltip = tooltipRef.current;
        tooltip.style.display = "block";
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        const preview = d.chunk.content.length > 120
          ? d.chunk.content.slice(0, 120) + "…"
          : d.chunk.content;
        tooltip.innerHTML = `
          <div class="font-mono text-xs" style="color: #5b9cf6">${d.id}</div>
          <div class="text-xs mt-1 max-w-[280px]" style="color: #7a8ba3; line-height: 1.5">${preview}</div>
        `;
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return;
        tooltipRef.current.style.left = `${event.clientX + 12}px`;
        tooltipRef.current.style.top = `${event.clientY - 10}px`;
      })
      .on("mouseleave", () => {
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      })
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      );

    // Node labels (hidden by default)
    const nodeLabel = nodeGroup
      .selectAll("text.node-label")
      .data(nodes)
      .join("text")
      .attr("class", "node-label")
      .attr("font-size", "7px")
      .attr("font-family", "monospace")
      .attr("fill", "#7a8ba3")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("dy", (d) => nodeRadius(d.chunk) + 10)
      .attr("opacity", 0)
      .text((d) => shortLabel(d.id));

    /* ── Tick ─────────────────────────────────────────────── */

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

      // Outer rings follow nodes
      nodeGroup
        .selectAll<SVGCircleElement, SimNode>("circle.critical-ring")
        .attr("cx", (d) => d.x!)
        .attr("cy", (d) => d.y!);
      nodeGroup
        .selectAll<SVGCircleElement, SimNode>("circle.meta-ring")
        .attr("cx", (d) => d.x!)
        .attr("cy", (d) => d.y!);

      nodeLabel.attr("x", (d) => d.x!).attr("y", (d) => d.y!);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 4);
    });

    // Auto-fit zoom after simulation settles (~68% scale)
    simulation.on("end", () => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0) {
        const padding = 60;
        const rawScale = Math.min(
          width / (bounds.width + padding * 2),
          height / (bounds.height + padding * 2),
        );
        const scale = Math.min(rawScale, 0.68);
        const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
        const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
        svg
          .transition()
          .duration(600)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait, filteredChunks]);

  /* ── Highlight logic (selection + view mode + search) ──── */

  useEffect(() => {
    if (!svgRef.current || !portrait) return;
    const svg = d3.select(svgRef.current);

    // Build neighbor map
    const neighborMap = new Map<string, Set<string>>();
    for (const r of portrait.relations) {
      if (!neighborMap.has(r.source)) neighborMap.set(r.source, new Set());
      if (!neighborMap.has(r.target)) neighborMap.set(r.target, new Set());
      neighborMap.get(r.source)!.add(r.target);
      neighborMap.get(r.target)!.add(r.source);
    }

    const expand1Hop = (ids: Set<string>): Set<string> => {
      const expanded = new Set(ids);
      for (const id of ids) {
        const neighbors = neighborMap.get(id);
        if (neighbors) for (const n of neighbors) expanded.add(n);
      }
      return expanded;
    };

    // Compute visible set based on view mode
    let visibleSet: Set<string> | null = null; // null = show all

    if (viewMode === "critical") {
      const seeds = new Set(
        portrait.chunks
          .filter((c) => c.uniqueness === "CRITICAL" || c.type === "meta")
          .map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "identity") {
      const seeds = new Set(
        portrait.chunks
          .filter((c) => c.cluster.includes("identity"))
          .map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "knowledge") {
      visibleSet = new Set(
        portrait.chunks
          .filter((c) => !c.cluster.includes("identity"))
          .map((c) => c.chunk_id),
      );
    } else if (viewMode === "meta") {
      const seeds = new Set(
        portrait.chunks
          .filter((c) => c.type === "meta")
          .map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "emotions") {
      const seeds = new Set(
        portrait.chunks
          .filter((c) => c.type === "emotion")
          .map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "gaps") {
      // Orphans: degree ≤ 1
      const degrees = new Map<string, number>();
      for (const r of portrait.relations) {
        degrees.set(r.source, (degrees.get(r.source) ?? 0) + 1);
        degrees.set(r.target, (degrees.get(r.target) ?? 0) + 1);
      }
      // Clusters with zero cross-cluster edges
      const crossCluster = new Set<string>();
      for (const r of portrait.relations) {
        const srcChunk = portrait.chunks.find((c) => c.chunk_id === r.source);
        const tgtChunk = portrait.chunks.find((c) => c.chunk_id === r.target);
        if (srcChunk && tgtChunk && srcChunk.cluster !== tgtChunk.cluster) {
          crossCluster.add(srcChunk.cluster);
          crossCluster.add(tgtChunk.cluster);
        }
      }
      visibleSet = new Set(
        portrait.chunks
          .filter(
            (c) =>
              (degrees.get(c.chunk_id) ?? 0) <= 1 ||
              !crossCluster.has(c.cluster),
          )
          .map((c) => c.chunk_id),
      );
    }

    // Graph search overlay dimming
    let searchSet: Set<string> | null = null;
    if (graphSearch.trim()) {
      const q = graphSearch.trim().toLowerCase();
      searchSet = new Set(
        portrait.chunks
          .filter(
            (c) =>
              c.chunk_id.toLowerCase().includes(q) ||
              c.cluster.toLowerCase().includes(q) ||
              c.content.toLowerCase().includes(q),
          )
          .map((c) => c.chunk_id),
      );
    }

    // Selection highlighting
    let selectionSet: Set<string> | null = null;
    if (selectedChunkId) {
      selectionSet = new Set([selectedChunkId]);
      const neighbors = neighborMap.get(selectedChunkId);
      if (neighbors) for (const n of neighbors) selectionSet.add(n);
    }

    // Apply node opacity
    svg
      .selectAll<SVGCircleElement, SimNode>("circle.node")
      .attr("opacity", (d) => {
        if (selectionSet) return selectionSet.has(d.id) ? 1 : 0.07;
        if (searchSet) return searchSet.has(d.id) ? 1 : 0.04;
        if (visibleSet) return visibleSet.has(d.id) ? 1 : 0.05;
        return 1;
      });

    // Outer rings follow node opacity
    svg
      .selectAll<SVGCircleElement, SimNode>("circle.critical-ring")
      .attr("opacity", (d) => {
        if (selectionSet) return selectionSet.has(d.id) ? 0.35 : 0.02;
        if (searchSet) return searchSet.has(d.id) ? 0.35 : 0.02;
        if (visibleSet) return visibleSet.has(d.id) ? 0.35 : 0.02;
        return 0.35;
      });

    svg
      .selectAll<SVGCircleElement, SimNode>("circle.meta-ring")
      .attr("opacity", (d) => {
        if (selectionSet) return selectionSet.has(d.id) ? 0.35 : 0.02;
        if (searchSet) return searchSet.has(d.id) ? 0.35 : 0.02;
        if (visibleSet) return visibleSet.has(d.id) ? 0.35 : 0.02;
        return 0.35;
      });

    // Edge opacity
    svg
      .selectAll<SVGLineElement, SimLink>("line")
      .attr("stroke-opacity", (d) => {
        const src =
          typeof d.source === "object" ? (d.source as SimNode).id : String(d.source);
        const tgt =
          typeof d.target === "object" ? (d.target as SimNode).id : String(d.target);

        if (selectionSet) {
          return src === selectedChunkId || tgt === selectedChunkId ? 0.88 : 0.02;
        }
        if (searchSet) {
          return searchSet.has(src) && searchSet.has(tgt) ? 0.4 : 0.02;
        }
        if (visibleSet) {
          return visibleSet.has(src) && visibleSet.has(tgt) ? 0.3 : 0.02;
        }
        return 0.2;
      });

    // Labels visibility
    svg
      .selectAll<SVGTextElement, SimNode>("text.node-label")
      .attr("opacity", () => (viewMode === "labels" ? 0.8 : 0));

    // Relation labels visibility
    svg
      .selectAll<SVGTextElement, SimLink>("g.link-labels text")
      .attr("opacity", () => (viewMode === "relations" ? 0.7 : 0));
  }, [selectedChunkId, portrait, viewMode, graphSearch]);

  /* ── Rebuild on data / resize ──────────────────────────── */

  useEffect(() => {
    const cleanup = buildGraph();
    return () => cleanup?.();
  }, [buildGraph]);

  useEffect(() => {
    const handleResize = () => {
      const cleanup = buildGraph();
      return () => cleanup?.();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [buildGraph]);

  if (!portrait) {
    return (
      <div className="flex items-center justify-center h-full text-[--text-dim]">
        Loading graph…
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: "400px", background: "var(--surface-0)" }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden p-3 rounded-lg shadow-xl max-w-[320px] pointer-events-none"
        style={{
          display: "none",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      />

      {/* Graph search overlay (top-left) */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative">
          <input
            type="text"
            value={graphSearch}
            onChange={(e) => setGraphSearch(e.target.value)}
            placeholder="Search graph…"
            className="w-52 px-3 py-1.5 text-xs font-mono rounded border focus:outline-none focus:border-accent-blue"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {graphSearch && (
            <button
              onClick={() => setGraphSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Node count overlay (top-right) */}
      <div
        className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-mono"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          color: "var(--text-dim)",
        }}
      >
        {filteredChunks.length} nodes ·{" "}
        {portrait.relations.filter((r) => {
          const ids = new Set(filteredChunks.map((c) => c.chunk_id));
          return ids.has(r.source) && ids.has(r.target);
        }).length}{" "}
        edges
      </div>
    </div>
  );
}
