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
import type { Chunk } from "@/lib/types";

/* ── Simulation node / link ────────────────────────────────────── */

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  chunk: Chunk;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: { source: string; target: string; type: string; weight?: number; description?: string };
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

function shortLabel(id: string): string {
  const parts = id.split("-");
  return parts.length > 2 ? parts.slice(1).join("-") : id;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const {
    portrait,
    selectedChunkId,
    selectChunk,
    viewMode,
    filters,
  } = usePortrait();
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [graphSearch, setGraphSearch] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  /* ── Build graph (uses ALL chunks — dimming is visual only) ── */

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !portrait) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    const cx = width / 2;
    const cy = height / 2;

    const nodes: SimNode[] = portrait.chunks.map((chunk) => ({
      id: chunk.chunk_id,
      chunk,
    }));

    const chunkIds = new Set(portrait.chunks.map((c) => c.chunk_id));
    const links: SimLink[] = portrait.relations
      .filter((r) => chunkIds.has(r.source) && chunkIds.has(r.target))
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
          .distance((d) => (d.relation.type === "EXPRESSED_THROUGH" ? 65 : 100))
          .strength(0.26),
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(cx, cy))
      .force("collision", d3.forceCollide<SimNode>().radius(26));

    // Custom cluster gravity
    simulation.force("clusterGravity", (alpha: number) => {
      const centroids: Record<string, { x: number; y: number; count: number }> = {};
      for (const node of nodes) {
        const c = node.chunk.cluster;
        if (!centroids[c]) centroids[c] = { x: 0, y: 0, count: 0 };
        centroids[c].x += node.x ?? 0;
        centroids[c].y += node.y ?? 0;
        centroids[c].count++;
      }
      for (const key of Object.keys(centroids)) {
        const ct = centroids[key];
        ct.x /= ct.count;
        ct.y /= ct.count;
      }
      const k = alpha * 0.08;
      for (const node of nodes) {
        const ct = centroids[node.chunk.cluster];
        if (ct) {
          node.vx = (node.vx ?? 0) + (ct.x - (node.x ?? 0)) * k;
          node.vy = (node.vy ?? 0) + (ct.y - (node.y ?? 0)) * k;
        }
      }
    });

    // Bounding box force: push outliers back toward center
    simulation.force("bounds", (alpha: number) => {
      const k = alpha * 0.05;
      for (const node of nodes) {
        const dx = (node.x ?? 0) - cx;
        const dy = (node.y ?? 0) - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 600) {
          node.vx = (node.vx ?? 0) - dx * k;
          node.vy = (node.vy ?? 0) - dy * k;
        }
      }
    });

    simulationRef.current = simulation;

    /* ── SVG structure ────────────────────────────────────── */

    const defs = svg.append("defs");
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

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);
    zoomRef.current = zoom;

    svg.on("click", (event) => {
      if (event.target === svgRef.current) selectChunk(null);
    });

    /* ── Edges ────────────────────────────────────────────── */

    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => RELATION_COLORS[d.relation.type] ?? "#333")
      .attr("stroke-opacity", 0.12)
      .attr("stroke-width", (d) => 0.5 + (d.relation.weight ?? 0.5))
      .attr("stroke-dasharray", (d) =>
        d.relation.type === "EXPRESSED_THROUGH" ? "5 3" : "",
      )
      .attr("marker-end", (d) => `url(#arrow-${d.relation.type})`)
      .style("transition", "stroke-opacity 0.15s ease");

    // Relation labels (hidden by default)
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
        setHoveredNodeId(d.id);
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
        setHoveredNodeId(null);
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

    // Node labels — default ON, 7px monospace, #bfcde0
    const nodeLabel = nodeGroup
      .selectAll("text.node-label")
      .data(nodes)
      .join("text")
      .attr("class", "node-label")
      .attr("font-size", "7px")
      .attr("font-family", "monospace")
      .attr("fill", "#bfcde0")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("dy", (d) => nodeRadius(d.chunk) + 9)
      .attr("opacity", 0.8)
      .text((d) => shortLabel(d.id));

    /* ── Tick ─────────────────────────────────────────────── */

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

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

    // Auto-fit after settle
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

    return () => { simulation.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait]);

  /* ── Highlight logic ───────────────────────────────────── */

  useEffect(() => {
    if (!svgRef.current || !portrait) return;
    const svg = d3.select(svgRef.current);

    // Build neighbor map + chunk lookup
    const neighborMap = new Map<string, Set<string>>();
    const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id, c]));
    for (const r of portrait.relations) {
      if (!neighborMap.has(r.source)) neighborMap.set(r.source, new Set());
      if (!neighborMap.has(r.target)) neighborMap.set(r.target, new Set());
      neighborMap.get(r.source)!.add(r.target);
      neighborMap.get(r.target)!.add(r.source);
    }

    const expand1Hop = (ids: Set<string>): Set<string> => {
      const expanded = new Set(ids);
      for (const r of portrait.relations) {
        if (ids.has(r.source) || ids.has(r.target)) {
          expanded.add(r.source);
          expanded.add(r.target);
        }
      }
      return expanded;
    };

    // ── View mode sets ──
    let visibleSet: Set<string> | null = null;
    let isGapsMode = false;

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
        portrait.chunks.filter((c) => c.type === "meta").map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "emotions") {
      const seeds = new Set(
        portrait.chunks.filter((c) => c.type === "emotion").map((c) => c.chunk_id),
      );
      visibleSet = expand1Hop(seeds);
    } else if (viewMode === "gaps") {
      isGapsMode = true;
      const degrees = new Map<string, number>();
      for (const r of portrait.relations) {
        degrees.set(r.source, (degrees.get(r.source) ?? 0) + 1);
        degrees.set(r.target, (degrees.get(r.target) ?? 0) + 1);
      }
      const crossClusterCounts = new Map<string, number>();
      for (const r of portrait.relations) {
        const sc = chunkMap.get(r.source)?.cluster;
        const tc = chunkMap.get(r.target)?.cluster;
        if (sc && tc && sc !== tc) {
          crossClusterCounts.set(sc, (crossClusterCounts.get(sc) ?? 0) + 1);
          crossClusterCounts.set(tc, (crossClusterCounts.get(tc) ?? 0) + 1);
        }
      }
      visibleSet = new Set(
        portrait.chunks
          .filter(
            (c) =>
              (degrees.get(c.chunk_id) ?? 0) <= 1 ||
              (crossClusterCounts.get(c.cluster) ?? 0) === 0,
          )
          .map((c) => c.chunk_id),
      );
    }

    // ── Graph search ──
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

    // ── Filter set (cluster + type + uniqueness from header dropdowns) ──
    const activeCluster = filters.cluster;
    const hasFilter = !!(filters.cluster || filters.type || filters.uniqueness);
    let filterSet: Set<string> | null = null;
    if (hasFilter) {
      filterSet = new Set(
        portrait.chunks
          .filter((c) => {
            if (filters.cluster && c.cluster !== filters.cluster) return false;
            if (filters.type && c.type !== filters.type) return false;
            if (filters.uniqueness && c.uniqueness !== filters.uniqueness) return false;
            return true;
          })
          .map((c) => c.chunk_id),
      );
    }

    // ── Selection ──
    let selectionSet: Set<string> | null = null;
    if (selectedChunkId) {
      selectionSet = new Set([selectedChunkId]);
      const neighbors = neighborMap.get(selectedChunkId);
      if (neighbors) for (const n of neighbors) selectionSet.add(n);
    }

    // ── Hover set ──
    let hoverSet: Set<string> | null = null;
    if (hoveredNodeId && !selectedChunkId) {
      hoverSet = new Set([hoveredNodeId]);
      const neighbors = neighborMap.get(hoveredNodeId);
      if (neighbors) for (const n of neighbors) hoverSet.add(n);
    }

    // ── Helper: get link endpoint IDs ──
    const linkIds = (d: SimLink): [string, string] => {
      const src = typeof d.source === "object" ? (d.source as SimNode).id : String(d.source);
      const tgt = typeof d.target === "object" ? (d.target as SimNode).id : String(d.target);
      return [src, tgt];
    };

    // ── Apply node opacity (priority: selection > hover > search > filter > view mode > default) ──
    svg
      .selectAll<SVGCircleElement, SimNode>("circle.node")
      .attr("opacity", (d) => {
        if (selectionSet) return selectionSet.has(d.id) ? 1 : 0.07;
        if (hoverSet) return d.id === hoveredNodeId ? 1 : hoverSet.has(d.id) ? 0.7 : 1;
        if (searchSet) return searchSet.has(d.id) ? 1 : 0.04;
        if (filterSet) return filterSet.has(d.id) ? 1 : 0.05;
        if (visibleSet) {
          if (isGapsMode) return visibleSet.has(d.id) ? 0.95 : 0.1;
          return visibleSet.has(d.id) ? 1 : 0.05;
        }
        return 1;
      });

    // Outer rings
    const ringOpacity = (d: SimNode, baseOpacity: number) => {
      if (selectionSet) return selectionSet.has(d.id) ? baseOpacity : 0.02;
      if (searchSet) return searchSet.has(d.id) ? baseOpacity : 0.02;
      if (filterSet) return filterSet.has(d.id) ? baseOpacity : 0.02;
      if (visibleSet) return visibleSet.has(d.id) ? baseOpacity : 0.02;
      return baseOpacity;
    };

    svg.selectAll<SVGCircleElement, SimNode>("circle.critical-ring")
      .attr("opacity", (d) => ringOpacity(d, 0.35));
    svg.selectAll<SVGCircleElement, SimNode>("circle.meta-ring")
      .attr("opacity", (d) => ringOpacity(d, 0.35));

    // ── Edge opacity ──
    svg
      .selectAll<SVGLineElement, SimLink>("line")
      .attr("stroke-opacity", (d) => {
        const [src, tgt] = linkIds(d);

        if (selectionSet) {
          return src === selectedChunkId || tgt === selectedChunkId ? 0.85 : 0.02;
        }
        if (hoverSet) {
          return src === hoveredNodeId || tgt === hoveredNodeId ? 0.5 : 0.12;
        }
        if (searchSet) {
          return searchSet.has(src) && searchSet.has(tgt) ? 0.4 : 0.02;
        }
        if (filterSet) {
          const srcIn = filterSet.has(src);
          const tgtIn = filterSet.has(tgt);
          // Both endpoints in filter → full visible
          if (srcIn && tgtIn) return 0.6;
          // One endpoint touching → half visible
          if (srcIn || tgtIn) return 0.3;
          return 0.02;
        }
        if (visibleSet) {
          const srcIn = visibleSet.has(src);
          const tgtIn = visibleSet.has(tgt);
          return srcIn || tgtIn ? 0.85 : 0.02;
        }
        return 0.12;
      });

    // ── Labels visibility ──
    const showLabels = viewMode !== "labels"; // default ON, toggle OFF
    svg.selectAll<SVGTextElement, SimNode>("text.node-label")
      .attr("opacity", (d) => {
        if (!showLabels) return 0;
        // Dim labels with their nodes
        if (selectionSet) return selectionSet.has(d.id) ? 0.8 : 0.05;
        if (searchSet) return searchSet.has(d.id) ? 0.8 : 0.03;
        if (activeCluster) return d.chunk.cluster === activeCluster ? 0.8 : 0.05;
        if (visibleSet) return visibleSet.has(d.id) ? 0.8 : 0.05;
        return 0.8;
      });

    // Relation labels
    svg.selectAll<SVGTextElement, SimLink>("g.link-labels text")
      .attr("opacity", () => (viewMode === "relations" ? 0.7 : 0));
  }, [selectedChunkId, portrait, viewMode, graphSearch, filters.cluster, filters.type, filters.uniqueness, hoveredNodeId]);

  /* ── Rebuild on data / resize ──────────────────────────── */

  useEffect(() => {
    const cleanup = buildGraph();
    return () => cleanup?.();
  }, [buildGraph]);

  useEffect(() => {
    const handleResize = () => { buildGraph(); };
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
    </div>
  );
}
