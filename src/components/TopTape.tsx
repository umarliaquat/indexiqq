"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@phosphor-icons/react";

export function TopTape() {
  const [indices, setIndices] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('/api/market/indices').then(r => r.json()).then(data => {
      if (data.data) setIndices(data.data);
    }).catch(e => console.error(e));
  }, []);

  if (indices.length === 0) return <div style={{ height: "40px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", padding: "0 1.5rem" }}><Spinner size={14} className="animate-spin" color="var(--color-text-tertiary)" /></div>;

  return (
    <div style={{ height: "40px", borderBottom: "1px solid var(--color-border)", overflow: "hidden", display: "flex", alignItems: "center", position: "relative" }}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-content {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
          padding-left: 2.5rem;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="marquee-content" style={{ display: "flex", gap: "2.5rem", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 500 }}>
        {[...indices, ...indices].map((idx, i) => (
          <div key={`${idx.symbol}-${i}`} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{idx.shortName}</span>
            <span style={{ color: "var(--color-text-primary)" }}>{idx.price.toFixed(2)}</span>
            <span style={{ color: idx.change >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}>
              {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
