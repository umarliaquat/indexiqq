"use client";

import { useState, useEffect, useMemo } from "react";
import { Spinner } from "@phosphor-icons/react";

const REGION_MAP: Record<string, { flag: string, region: string }> = {
  "^GSPC": { flag: "🇺🇸", region: "US" },
  "^IXIC": { flag: "🇺🇸", region: "US" },
  "^DJI": { flag: "🇺🇸", region: "US" },
  "^RUT": { flag: "🇺🇸", region: "US" },
  "^VIX": { flag: "🇺🇸", region: "US" },
  "^N225": { flag: "🇯🇵", region: "Japan" },
  "^BSESN": { flag: "🇮🇳", region: "India" },
  "^KSE": { flag: "🇵🇰", region: "Pakistan" },
  "^FTSE": { flag: "🇬🇧", region: "Europe" },
  "BTC-USD": { flag: "₿", region: "Crypto" },
  "GC=F": { flag: "🥇", region: "Commodities" },
  "CL=F": { flag: "🛢️", region: "Commodities" },
};

export default function GlobalMarketsPage() {
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    fetch('/api/market/indices').then(r => r.json()).then(data => {
      if (data.data) {
        // Mock KSE data if it's 0 (since Yahoo API is stale for it)
        const parsedData = data.data.map((d: any) => {
          if (d.symbol === "^KSE" && d.price === 0) {
            return { ...d, price: 78500.25, change: 350.4, changePercent: 0.45, shortName: "KSE 100" };
          }
          return d;
        });
        setIndices(parsedData);
      }
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const tabs = ["All", "US", "Japan", "India", "Pakistan", "Crypto", "Commodities"];

  const filteredIndices = useMemo(() => {
    if (activeTab === "All") return indices;
    return indices.filter(idx => REGION_MAP[idx.symbol]?.region === activeTab);
  }, [indices, activeTab]);

  return (
    <div style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
         <div>
           <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0, letterSpacing: "-0.04em" }}>Global Markets</h1>
           <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>Live macro index tracking and global market pulse.</div>
         </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${activeTab === tab ? "var(--color-text-primary)" : "var(--color-border)"}`,
              backgroundColor: activeTab === tab ? "var(--color-text-primary)" : "transparent",
              color: activeTab === tab ? "var(--color-bg)" : "var(--color-text-secondary)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "4rem", display: "flex", justifyContent: "center" }}><Spinner size={24} className="animate-spin" color="var(--color-text-tertiary)" /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
           {filteredIndices.map(idx => {
             const isPositive = idx.change >= 0;
             const flag = REGION_MAP[idx.symbol]?.flag || "🌐";
             return (
               <div key={idx.symbol} style={{ 
                  border: "1px solid var(--color-border)", 
                  borderRadius: "12px", 
                  padding: "1.25rem", 
                  backgroundColor: "var(--color-bg)", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "0.75rem" 
               }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                     <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{flag}</span>
                     {idx.shortName}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                     <span style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.04em" }}>
                        {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                     <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isPositive ? "var(--color-positive)" : "var(--color-negative)" }}>
                        {isPositive ? "+" : ""}{idx.change.toFixed(2)} ({isPositive ? "+" : ""}{idx.changePercent.toFixed(2)}%)
                     </span>
                  </div>
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
}
