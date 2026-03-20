"use client";

import { usePortrait } from "@/lib/portrait-context";
import type { ViewMode } from "@/lib/types";

interface ModeButton {
  mode: ViewMode | "reset";
  icon: string;
  label: string;
}

const MODES: ModeButton[] = [
  { mode: "reset", icon: "⟳", label: "Reset" },
  { mode: "labels", icon: "∷", label: "Labels" },
  { mode: "relations", icon: "⇢", label: "Relations" },
  { mode: "gaps", icon: "⚠", label: "Gaps" },
  { mode: "critical", icon: "●", label: "CRITICAL" },
  { mode: "identity", icon: "🎭", label: "Identity" },
  { mode: "knowledge", icon: "🧠", label: "Knowledge" },
  { mode: "meta", icon: "✦", label: "Meta" },
  { mode: "emotions", icon: "♡", label: "Emotions" },
];

export default function ViewModeBar() {
  const { viewMode, setViewMode, selectChunk } = usePortrait();

  const handleClick = (btn: ModeButton) => {
    if (btn.mode === "reset") {
      setViewMode(null);
      selectChunk(null);
      return;
    }
    // Toggle: clicking active mode deactivates it
    setViewMode(viewMode === btn.mode ? null : btn.mode);
  };

  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
      {MODES.map((btn) => {
        const isActive =
          btn.mode !== "reset" && viewMode === btn.mode;

        return (
          <button
            key={btn.label}
            onClick={() => handleClick(btn)}
            title={btn.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-left font-mono transition-colors"
            style={{
              fontSize: "9px",
              background: isActive ? "var(--surface-3)" : "var(--surface-1)",
              border: `1px solid ${isActive ? "#5b9cf6" : "var(--border)"}`,
              color: isActive ? "#5b9cf6" : "var(--text-dim)",
            }}
          >
            <span className="w-4 text-center text-[11px]">{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}
