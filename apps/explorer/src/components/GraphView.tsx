"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import { usePortrait } from "@/lib/portrait-context";
import { clusterColor, RELATION_COLORS, UNIQUENESS_RADIUS } from "@/lib/colors";
import type { Chunk, Relation } from "@/lib/types";

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  chunk: Chunk;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: Relation;
}

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { portrait, filteredChunks, selectedChunkId, selectChunk } = usePortrait();
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !portrait) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // Build filtered node/link sets
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

    // Simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => UNIQUENESS_RADIUS[d.chunk?.uniqueness] ?? 6 + 4));

    simulationRef.current = simulation;

    // Zoom
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 6])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Arrow markers for each relation type
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

    // Links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => RELATION_COLORS[d.relation.type] ?? "#444")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr("marker-end", (d) => `url(#arrow-${d.relation.type})`);

    // Nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => UNIQUENESS_RADIUS[d.chunk.uniqueness] ?? 6)
      .attr("fill", (d) => clusterColor(d.chunk.cluster))
      .attr("stroke", "#0a0a0f")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        selectChunk(selectedChunkId === d.id ? null : d.id);
      })
      .on("mouseenter", (event, d) => {
        if (!tooltipRef.current) return;
        const tooltip = tooltipRef.current;
        tooltip.style.display = "block";
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.innerHTML = `
          <div class="font-mono text-xs text-accent-blue">${d.id}</div>
          <div class="text-xs text-[--text-secondary] mt-0.5">${d.chunk.cluster} / ${d.chunk.type}</div>
          <div class="text-xs mt-1 max-w-[280px] line-clamp-3">${d.chunk.content}</div>
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

    // Link hover labels
    const linkLabel = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", "9px")
      .attr("fill", "#5a5a70")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("opacity", 0)
      .text((d) => d.relation.type);

    // Show link labels on hover
    link
      .on("mouseenter", function (_event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", 2.5);
        linkLabel.filter((l) => l === d).attr("opacity", 1);

        if (tooltipRef.current && d.relation.description) {
          const tooltip = tooltipRef.current;
          tooltip.style.display = "block";
          tooltip.innerHTML = `
            <div class="font-mono text-xs" style="color: ${RELATION_COLORS[d.relation.type] ?? '#888'}">${d.relation.type}</div>
            <div class="text-xs mt-1">${d.relation.description}</div>
          `;
        }
      })
      .on("mousemove", (event) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${event.clientX + 12}px`;
          tooltipRef.current.style.top = `${event.clientY - 10}px`;
        }
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-opacity", 0.4).attr("stroke-width", 1.5);
        linkLabel.attr("opacity", 0);
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 4);
    });

    // Fit to view after stabilization
    simulation.on("end", () => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds) {
        const padding = 40;
        const scale = Math.min(
          width / (bounds.width + padding * 2),
          height / (bounds.height + padding * 2),
          1.5,
        );
        const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
        const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
        svg
          .transition()
          .duration(500)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    });

    return () => {
      simulation.stop();
    };
  }, [portrait, filteredChunks, selectedChunkId, selectChunk]);

  // Highlight selected node + connections
  useEffect(() => {
    if (!svgRef.current || !portrait) return;
    const svg = d3.select(svgRef.current);

    if (!selectedChunkId) {
      svg.selectAll("circle").attr("opacity", 1);
      svg.selectAll("line").attr("opacity", 1);
      return;
    }

    const connectedIds = new Set<string>([selectedChunkId]);
    for (const r of portrait.relations) {
      if (r.source === selectedChunkId) connectedIds.add(r.target);
      if (r.target === selectedChunkId) connectedIds.add(r.source);
    }

    svg.selectAll<SVGCircleElement, SimNode>("circle").attr("opacity", (d) =>
      connectedIds.has(d.id) ? 1 : 0.15,
    );

    svg.selectAll<SVGLineElement, SimLink>("line").attr("opacity", (d) => {
      const src = typeof d.source === "object" ? (d.source as SimNode).id : d.source;
      const tgt = typeof d.target === "object" ? (d.target as SimNode).id : d.target;
      return src === selectedChunkId || tgt === selectedChunkId ? 1 : 0.05;
    });
  }, [selectedChunkId, portrait]);

  // Rebuild graph when data changes
  useEffect(() => {
    const cleanup = buildGraph();
    return () => cleanup?.();
  }, [buildGraph]);

  // Rebuild on resize
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
        className="w-full h-full bg-surface-0"
        style={{ minHeight: "400px" }}
      />
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden p-3 bg-surface-2 border border-[--border] rounded-lg shadow-xl max-w-[320px] pointer-events-none"
        style={{ display: "none" }}
      />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 p-2 bg-surface-1/90 border border-[--border] rounded text-[10px] font-mono space-y-1">
        <div className="text-[--text-dim] mb-1">Clusters</div>
        {[...new Set(filteredChunks.map((c) => c.cluster))].slice(0, 8).map((cluster) => (
          <div key={cluster} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: clusterColor(cluster) }}
            />
            <span className="text-[--text-secondary]">{cluster}</span>
          </div>
        ))}
      </div>
      {/* Node count */}
      <div className="absolute top-3 right-3 p-2 bg-surface-1/90 border border-[--border] rounded text-xs font-mono text-[--text-dim]">
        {filteredChunks.length} nodes · {portrait.relations.filter((r) => {
          const ids = new Set(filteredChunks.map((c) => c.chunk_id));
          return ids.has(r.source) && ids.has(r.target);
        }).length} edges
      </div>
    </div>
  );
}
