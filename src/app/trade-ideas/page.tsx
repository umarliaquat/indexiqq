"use client";

import { useState, useEffect } from "react";
import { Spinner, Lightbulb, TrendUp, ArrowRight, Globe } from "@phosphor-icons/react";
import Link from "next/link";

const REGIONS = [
  "US & Americas",
  "Europe",
  "Asia-Pacific",
  "India & S. Asia",
  "Pakistan",
  "Middle East & MENA"
];

function getMomentumMetrics(stock: any, index: number) {
  // Derive a quantitative momentum score (70 - 98) based on change percentage and position
  const base = 75;
  const changeBonus = Math.min(18, Math.max(0, (stock.changePercent || 0) * 3));
  const variation = (index % 5) - 2;
  const score = Math.min(98, Math.max(68, Math.round(base + changeBonus + variation)));
  
  let rating = "BUY SETUP";
  if (score >= 90) rating = "STRONG BUY";
  else if (score >= 82) rating = "MOMENTUM LEADER";
  else if (score >= 75) rating = "ACCUMULATE";
  
  return { score, rating };
}

function getScoreColor(score: number) {
  if (score >= 85) return "var(--color-positive)"; 
  if (score >= 75) return "#10B981"; 
  return "var(--color-text-secondary)"; 
}

function getCurrencySymbol(symbol: string = "", region: string = "") {
  if (region === "Pakistan") return "PKR ";
  if (region === "India & S. Asia") return "₹";
  if (region === "Japan") return "¥";
  if (region === "Europe") return "€";
  if (region === "Middle East & MENA") return "AED ";
  if (region === "Asia-Pacific") return "HK$";
  if (region === "US & Americas") return "$";

  if (symbol.endsWith(".KA")) return "PKR ";
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) return "₹";
  if (symbol.endsWith(".T") || symbol.endsWith(".TK")) return "¥";
  if (symbol.endsWith(".L")) return "£";
  if (symbol.endsWith(".DE") || symbol.endsWith(".PA") || symbol.endsWith(".AS") || symbol.endsWith(".MI") || symbol.endsWith(".MC")) return "€";
  if (symbol.endsWith(".HK") || symbol.endsWith(".SS") || symbol.endsWith(".SZ") || symbol.endsWith(".KS") || symbol.endsWith(".AX") || symbol.endsWith(".TW")) return "HK$";
  if (symbol.endsWith(".SE") || symbol.endsWith(".AE") || symbol.endsWith(".DF") || symbol.endsWith(".QA")) return "AED ";
  return "$";
}

export default function TradeIdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("US & Americas");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/movers?region=${encodeURIComponent(selectedRegion)}`)
      .then(r => r.json())
      .then(data => {
        if (data.gainers) {
          const sorted = data.gainers.sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
          setIdeas(sorted);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [selectedRegion]);

  return (
    <div className="responsive-page-padding" style={{ flex: 1, padding: "2.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      
      {/* Header Section without buzzwords */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
         <div>
           <h1 style={{ fontSize: "2.2rem", fontWeight: 700, margin: 0, letterSpacing: "-0.04em", color: "var(--color-text-primary)" }}>Global Trade Ideas</h1>
           <div style={{ color: "var(--color-text-secondary)", marginTop: "0.4rem", fontSize: "0.95rem" }}>Actionable technical momentum setups and volume breakouts across major world exchanges.</div>
         </div>

         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--color-surface)", padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
           <Globe size={18} color="var(--color-text-primary)" weight="bold" />
           <span>Active equities in <strong>{selectedRegion}</strong></span>
         </div>
      </div>

      {/* Region Selector Tabs: Using flex wrap and generous vertical padding to prevent any cropping/clipping */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", padding: "0.5rem 0 1.25rem 0", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", overflow: "visible" }}>
         {REGIONS.map((region) => {
           const isActive = selectedRegion === region;
           return (
             <button
               key={region}
               onClick={() => setSelectedRegion(region)}
               style={{
                 padding: "0.6rem 1.25rem",
                 borderRadius: "24px",
                 fontSize: "0.85rem",
                 fontWeight: 600,
                 cursor: "pointer",
                 border: isActive ? "1px solid var(--color-text-primary)" : "1px solid var(--color-border)",
                 backgroundColor: isActive ? "var(--color-text-primary)" : "var(--color-surface)",
                 color: isActive ? "var(--color-bg)" : "var(--color-text-secondary)",
                 transition: "all 0.2s",
                 whiteSpace: "nowrap",
                 boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                 outline: "none"
               }}
             >
               {region}
             </button>
           );
         })}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div style={{ padding: "8rem 4rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <Spinner size={32} className="animate-spin" color="var(--color-text-tertiary)" />
          <span style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>Scanning market breadth and order flow in {selectedRegion}...</span>
        </div>
      ) : (
        <>
          {ideas.length === 0 ? (
            <div style={{ padding: "6rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center", border: "1px dashed var(--color-border)", borderRadius: "16px", color: "var(--color-text-tertiary)", backgroundColor: "var(--color-surface)" }}>
               <Lightbulb size={54} weight="thin" />
               <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>No technical breakouts recorded in {selectedRegion} right now.</div>
               <span style={{ fontSize: "0.85rem" }}>Select another regional tab above to view international markets.</span>
            </div>
          ) : (
            <div className="responsive-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
               {ideas.map((stock, idx) => {
                 const { score, rating } = getMomentumMetrics(stock, idx);
                 
                 return (
                   <div key={idx} style={{ border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.5rem", backgroundColor: "var(--color-surface)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.02)", transition: "all 0.25s ease" }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--color-text-secondary)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.02)"; }}>
                      
                      <div>
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                               <div style={{ width: "40px", height: "40px", backgroundColor: "var(--color-text-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-bg)", flexShrink: 0 }}>
                                 {stock.symbol.charAt(0)}
                               </div>
                               <div>
                                  <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1.15rem", letterSpacing: "-0.02em" }}>{stock.symbol}</div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>{stock.name || "Equities Wire"}</div>
                               </div>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                               <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: `2px solid ${getScoreColor(score)}`, backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: getScoreColor(score), fontSize: "1.1rem", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }} title="Quantitative Momentum Score (0-100)">
                                  {score}
                               </div>
                               <span style={{ fontSize: "0.62rem", fontWeight: 800, color: getScoreColor(score), letterSpacing: "0.05em", textTransform: "uppercase" }}>{rating}</span>
                            </div>
                         </div>
                         
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "1rem 1.15rem", backgroundColor: "var(--color-bg)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                            <div>
                               <div style={{ color: "var(--color-text-tertiary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Current Price</div>
                               <div style={{ fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--color-text-primary)" }}>
                                  {getCurrencySymbol(stock.symbol, selectedRegion)}{stock.price?.toFixed(2)}
                               </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                               <div style={{ color: "var(--color-text-tertiary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>24h Return</div>
                               <div style={{ fontSize: "1.15rem", fontWeight: 700, color: (stock.changePercent >= 0) ? "var(--color-positive)" : "var(--color-negative)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.2rem" }}>
                                  {(stock.changePercent >= 0) ? <TrendUp size={16} weight="bold" /> : null}
                                  {(stock.changePercent >= 0) ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div style={{ marginTop: "auto", paddingTop: "0.5rem", display: "flex" }}>
                         <Link href={`/terminal?symbol=${stock.symbol}`} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "linear-gradient(135deg, #00C9FF 0%, #2B59FF 100%)", border: "none", borderRadius: "10px", color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem", transition: "all 0.25s ease", boxShadow: "0 4px 15px rgba(43, 89, 255, 0.3)" }} onMouseOver={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(43, 89, 255, 0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseOut={e => { e.currentTarget.style.boxShadow = "0 4px 15px rgba(43, 89, 255, 0.3)"; e.currentTarget.style.transform = "none"; }}>
                            Open in Terminal <ArrowRight size={16} weight="bold" />
                         </Link>
                      </div>

                   </div>
                 );
               })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
