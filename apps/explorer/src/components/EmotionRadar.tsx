"use client";

import { useRef, useEffect, useMemo } from "react";
import { usePortrait } from "@/lib/portrait-context";

const EMOTION_AXES = [
  { key: "enthusiasm", label: "Enthusiasm", color: "#eab308" },
  { key: "anger", label: "Anger", color: "#ef4444" },
  { key: "fear", label: "Fear", color: "#a855f7" },
  { key: "pride", label: "Pride", color: "#22c55e" },
  { key: "sadness", label: "Sadness", color: "#4a9eff" },
  { key: "trust", label: "Trust", color: "#06b6d4" },
];

const EMOTION_KEYWORDS: Record<string, string[]> = {
  enthusiasm: ["enthusiasm", "excited", "passionate", "love", "enjoy", "energized", "motivat"],
  anger: ["anger", "frustrat", "furious", "annoy", "irritat", "rage", "furious"],
  fear: ["fear", "anxious", "worried", "nervous", "dread", "panic", "stress"],
  pride: ["pride", "proud", "accomplish", "satisf", "achievement", "confident"],
  sadness: ["sad", "disappoint", "regret", "loss", "grief", "melanchol"],
  trust: ["trust", "rely", "depend", "loyal", "faith", "confiden", "safe"],
};

export default function EmotionRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { portrait, filters, setFilters } = usePortrait();

  const emotionScores = useMemo(() => {
    if (!portrait) return EMOTION_AXES.map(() => 0);

    // Count emotion-related chunks for each axis
    const emotionChunks = portrait.chunks.filter(
      (c) => c.type === "emotion" || c.type === "rant",
    );

    return EMOTION_AXES.map(({ key }) => {
      const keywords = EMOTION_KEYWORDS[key];
      let count = 0;

      for (const chunk of emotionChunks) {
        const lower = chunk.content.toLowerCase();
        if (keywords.some((kw) => lower.includes(kw))) {
          count++;
        }
        // Also check context tags
        if (chunk.context_tags.some((t) => keywords.some((kw) => t.includes(kw)))) {
          count++;
        }
      }

      return count;
    });
  }, [portrait]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = 260;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const maxRadius = 100;
    const numAxes = EMOTION_AXES.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const maxScore = Math.max(...emotionScores, 1);

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Background rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * maxRadius;
      ctx.beginPath();
      for (let i = 0; i <= numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "#2a2a38";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Axis lines and labels
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxRadius;
      const y = cy + Math.sin(angle) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#2a2a38";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Label
      const labelR = maxRadius + 16;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = EMOTION_AXES[i].color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(EMOTION_AXES[i].label, lx, ly);
    }

    // Data polygon
    ctx.beginPath();
    for (let i = 0; i <= numAxes; i++) {
      const idx = i % numAxes;
      const angle = idx * angleStep - Math.PI / 2;
      const r = (emotionScores[idx] / maxScore) * maxRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "#ec4899";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Data points
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = (emotionScores[i] / maxScore) * maxRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = EMOTION_AXES[i].color;
      ctx.fill();
    }
  }, [emotionScores]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
    const sectorIdx = Math.round(normalizedAngle / ((Math.PI * 2) / EMOTION_AXES.length)) % EMOTION_AXES.length;

    const keyword = EMOTION_AXES[sectorIdx].key;
    setFilters({
      ...filters,
      search: keyword,
      type: "emotion",
    });
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-3 self-start">
        Emotional Coverage
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer"
        title="Click an axis to filter emotion chunks"
      />
      <div className="mt-2 text-[10px] text-[--text-dim]">
        Click axis to filter
      </div>
    </div>
  );
}
