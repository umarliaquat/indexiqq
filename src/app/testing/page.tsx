"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CaretDown, CaretLeft, CaretRight, Plus, Check, ChartLineUp, MagnifyingGlass, Info, Spinner } from "@phosphor-icons/react";
import { Chart } from "@/components/Chart";
import Link from "next/link";

// --- Mock Data & Helpers ---
const INDICES = [
  { id: "INX", name: "S&P 500", ticker: "INX", price: "7,406.72", change: "-0.30%", isUp: false, points: "22.06" },
  { id: "DJI", name: "Dow Jones", ticker: "DJI", price: "51,988.33", change: "-1.44%", isUp: false, points: "760.10" },
  { id: "COMP", name: "NASDAQ", ticker: "COMP", price: "24,822.94", change: "-0.22%", isUp: false, points: "54.20" },
  { id: "RUT", name: "Russell 2000", ticker: "RUT", price: "2,940.54", change: "-0.45%", isUp: false, points: "13.20" },
  { id: "NYA", name: "NYSE Composite", ticker: "NYA", price: "24,156.31", change: "-0.30%", isUp: false, points: "72.45" },
  { id: "RUI", name: "Russell 1000", ticker: "RUI", price: "4,038.64", change: "-0.24%", isUp: false, points: "9.80" },
  { id: "UKX", name: "FTSE 100", ticker: "UKX", price: "10,908.41", change: "+0.34%", isUp: true, points: "36.50" },
];

function getDeterministicScores(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  hash = Math.abs(hash);
  return { aiScore: (hash % 10) + 1 };
}

const getScoreColor = (score: number) => {
  if (score >= 7) return "var(--color-positive)"; 
  if (score >= 4) return "var(--color-text-secondary)"; 
  return "var(--color-negative)"; 
};

const LOGO_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com', AMZN: 'amazon.com', 
  NVDA: 'nvidia.com', META: 'meta.com', TSLA: 'tesla.com', NFLX: 'netflix.com', 
  AMD: 'amd.com', INTC: 'intel.com', CRM: 'salesforce.com', ADBE: 'adobe.com', 
  CSCO: 'cisco.com', ORCL: 'oracle.com', QCOM: 'qualcomm.com', IBM: 'ibm.com',
  JPM: 'jpmorganchase.com', V: 'visa.com', MA: 'mastercard.com', BAC: 'bankofamerica.com', 
  WFC: 'wellsfargo.com', GS: 'goldmansachs.com', MS: 'morganstanley.com', AXP: 'americanexpress.com',
  JNJ: 'jnj.com', UNH: 'unitedhealthgroup.com', PFE: 'pfizer.com', ABBV: 'abbvie.com', 
  MRK: 'merck.com', TMO: 'thermofisher.com', PG: 'pg.com', KO: 'coca-colacompany.com', 
  PEP: 'pepsico.com', WMT: 'walmart.com', COST: 'costco.com', MCD: 'mcdonalds.com', 
  SBUX: 'starbucks.com', NKE: 'nike.com', XOM: 'exxonmobil.com', CVX: 'chevron.com', 
  BA: 'boeing.com', CAT: 'caterpillar.com', GE: 'ge.com'
};

const formatLargeNum = (num: number) => {
  if (!num) return "-";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toString();
};

const MockMiniSparkline = ({ isUp }: { isUp: boolean }) => {
  const color = isUp ? "var(--color-positive)" : "var(--color-negative)";
  const path = isUp 
    ? "M 0 20 L 10 15 L 20 18 L 30 10 L 40 12 L 50 5 L 60 8 L 70 0" 
    : "M 0 0 L 10 5 L 20 3 L 30 12 L 40 8 L 50 18 L 60 15 L 70 20";
  return (
    <svg width="70" height="20" viewBox="0 0 70 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="0" y1="10" x2="70" y2="10" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
};


// --- Contextual Table Component ---
function ContextualTable({ activeIdx }: { activeIdx: any }) {
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/market/movers').then(r => r.json()).then(data => {
      let combined = [...(data.gainers || []), ...(data.losers || [])];
      
      // MOCKING RELATIONSHIP: We shuffle or slice based on activeIdx to mock index filtering
      const seed = activeIdx.id.charCodeAt(0) % 3;
      if (seed === 1) combined = combined.reverse();
      if (seed === 2) combined = [...combined.slice(5), ...combined.slice(0, 5)];
      
      setAllStocks(combined.slice(0, 10)); // Just top 10 for overview
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, [activeIdx]);

  return (
    <div style={{ flex: 1, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Top {activeIdx.name} Movers</h3>
        </div>
        <Link href="/stocks" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          View all <CaretRight weight="bold" />
        </Link>
      </div>

      <div style={{ position: "relative", flex: 1, overflowY: "auto", minHeight: "150px" }}>
        {loading && (
           <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(var(--color-surface-rgb), 0.5)", zIndex: 10 }}>
              <Spinner size={24} className="animate-spin" color="var(--color-text-tertiary)" />
           </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "center", whiteSpace: "nowrap" }}>
          <thead style={{ backgroundColor: "var(--color-bg)" }}>
            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1.5rem", fontWeight: 600, textAlign: "left" }}>Asset</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>AI Score</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Price</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>% Change</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Volume</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>P/E</th>
              <th style={{ padding: "0.75rem 1.5rem", fontWeight: 600, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {allStocks.map((stock, i) => {
              const scores = getDeterministicScores(stock.symbol);
              return (
                <tr key={stock.symbol + i} style={{ borderBottom: "1px solid rgba(150,150,150,0.1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--color-border)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "0.5rem 1.5rem", textAlign: "left" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {LOGO_DOMAINS[stock.symbol] ? (
                           <img src={`https://www.google.com/s2/favicons?sz=64&domain=${LOGO_DOMAINS[stock.symbol]}`} alt={stock.symbol} style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#FFF", border: "1px solid rgba(0,0,0,0.1)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
                        ) : null}
                        <div style={{ display: LOGO_DOMAINS[stock.symbol] ? "none" : "flex", width: "24px", height: "24px", backgroundColor: "var(--color-text-primary)", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 600, color: "var(--color-bg)" }}>
                          {stock.symbol.charAt(0)}
                        </div>
                        <div>
                           <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{stock.symbol}</div>
                        </div>
                     </div>
                  </td>
                  <td style={{ padding: "0.5rem 1rem" }}>
                    <div style={{ margin: "0 auto", width: "28px", height: "28px", borderRadius: "50%", border: `1.5px solid ${getScoreColor(scores.aiScore)}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: getScoreColor(scores.aiScore), fontSize: "0.8rem" }}>
                       {scores.aiScore}
                    </div>
                  </td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 500, color: "var(--color-text-primary)" }}>${stock.price?.toFixed(2) || "-"}</td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 600, color: stock.changePercent >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) || "-"}%
                  </td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>{formatLargeNum(stock.volume)}</td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>{stock.peRatio ? stock.peRatio.toFixed(1) : "-"}</td>
                  <td style={{ padding: "0.5rem 1.5rem", textAlign: "right" }}>
                     <button style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Analyze</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Main Page ---
export default function TestingPage() {
  const [activeIdx, setActiveIdx] = useState(INDICES[0]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1D");
  const [marketsCollapsed, setMarketsCollapsed] = useState(false);
  
  const TABS = ["1D", "5D", "1M", "3M", "YTD", "1Y", "5Y", "Max"];
  
  useEffect(() => {
    let currentPrice = parseFloat(activeIdx.price.replace(',', ''));
    let data = [];
    let time = new Date();
    time.setHours(9, 30, 0, 0); 
    
    let points = 60;
    if (activeTab === "5D") points = 120;
    if (activeTab === "1M") points = 200;
    if (activeTab === "3M") points = 300;
    if (activeTab === "YTD") points = 400;
    if (activeTab === "1Y") points = 500;
    if (activeTab === "5Y") points = 800;
    if (activeTab === "Max") points = 1000;

    for(let i=0; i<points; i++) {
       const change = (Math.random() - 0.5) * 10;
       const open = currentPrice;
       const close = currentPrice + change;
       const high = Math.max(open, close) + Math.random() * 5;
       const low = Math.min(open, close) - Math.random() * 5;
       data.push({ time: Math.floor(time.getTime() / 1000), open, high, low, close });
       currentPrice = close;
       time.setMinutes(time.getMinutes() + 5);
    }
    setChartData(data);
  }, [activeIdx, activeTab]);

  return (
     <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "var(--color-bg)", overflow: "hidden" }}>
       
       {/* LEFT COLUMN: Market Sidebar */}
       {!marketsCollapsed ? (
         <div style={{ width: "300px", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", backgroundColor: "var(--color-surface)", flexShrink: 0 }}>
            <div style={{ padding: "1.25rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
               <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Global Markets</h2>
               <button onClick={() => setMarketsCollapsed(true)} title="Collapse Global Markets" style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-secondary)" }}>
                  <CaretLeft size={16} />
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "0.25rem" }}>
               {INDICES.map((idx) => (
                 <div 
                    key={idx.id} 
                    onClick={() => setActiveIdx(idx)}
                    style={{ 
                       display: "flex", alignItems: "center", justifyContent: "space-between",
                       padding: "0.75rem 0.5rem", borderRadius: "8px",
                       cursor: "pointer",
                       backgroundColor: activeIdx.id === idx.id ? "var(--color-bg)" : "transparent",
                       boxShadow: activeIdx.id === idx.id ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
                       border: activeIdx.id === idx.id ? "1px solid var(--color-border)" : "1px solid transparent",
                       transition: "all 0.2s"
                    }}
                 >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1 }}>
                       <span style={{ fontWeight: 600, fontSize: "0.85rem", color: activeIdx.id === idx.id ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{idx.name}</span>
                       <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>{idx.ticker}</span>
                    </div>
                    
                    <div style={{ padding: "0 0.5rem" }}>
                       <MockMiniSparkline isUp={idx.isUp} />
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", alignItems: "flex-end", flex: 1 }}>
                       <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-primary)" }}>{idx.price}</span>
                       <span style={{ fontSize: "0.7rem", fontWeight: 600, color: idx.isUp ? "var(--color-positive)" : "var(--color-negative)" }}>{idx.change}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       ) : (
         <div style={{ width: "48px", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "var(--color-surface)", padding: "1.25rem 0", flexShrink: 0 }}>
            <button onClick={() => setMarketsCollapsed(false)} title="Expand Global Markets" style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "6px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-secondary)" }}>
               <CaretRight size={16} />
            </button>
            <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", marginTop: "1.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.08em" }}>
               GLOBAL MARKETS
            </div>
         </div>
       )}

       {/* MAIN DASHBOARD */}
       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "1.25rem 1.5rem" }}>
          
          {/* Hero Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
             <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem 0", letterSpacing: "-0.02em" }}>{activeIdx.name} ({activeIdx.ticker})</h1>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                   <span style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--color-text-primary)" }}>{activeIdx.price}</span>
                   <span style={{ fontSize: "1rem", fontWeight: 600, color: activeIdx.isUp ? "var(--color-positive)" : "var(--color-negative)" }}>
                      {activeIdx.isUp ? '+' : '-'}{activeIdx.points} ({activeIdx.change})
                   </span>
                </div>
             </div>
             
             {/* Refined CTAs */}
             <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <button 
                  onClick={() => setInWatchlist(!inWatchlist)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px", backgroundColor: inWatchlist ? "var(--color-border)" : "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                >
                   {inWatchlist ? <Check weight="bold" size={14}/> : <Plus weight="bold" size={14}/>} 
                   {inWatchlist ? "Saved" : "Watchlist"}
                </button>
                <button 
                  onClick={() => setInsightsOpen(!insightsOpen)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.25rem", borderRadius: "8px", backgroundColor: insightsOpen ? "var(--color-surface)" : "var(--color-text-primary)", color: insightsOpen ? "var(--color-text-primary)" : "var(--color-bg)", border: insightsOpen ? "1px solid var(--color-border)" : "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", boxShadow: insightsOpen ? "none" : "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                   {insightsOpen ? "Hide AI Insights" : "View AI Insights"}
                </button>
             </div>
          </div>

          {/* SPLIT VIEW */}
          <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.25rem", height: "380px", flexShrink: 0 }}>
             
             {/* Main Chart Area */}
             <div style={{ flex: "2.5", display: "flex", flexDirection: "column", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden", minWidth: 0, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      {TABS.map(tab => (
                        <span 
                          key={tab} 
                          onClick={() => setActiveTab(tab)} 
                          style={{ 
                            cursor: "pointer", 
                            color: activeTab === tab ? "var(--color-text-primary)" : "var(--color-text-secondary)", 
                            borderBottom: activeTab === tab ? "2px solid var(--color-text-primary)" : "2px solid transparent", 
                            paddingBottom: "0.25rem", 
                            transition: "all 0.2s"
                          }}
                        >
                          {tab}
                        </span>
                      ))}
                   </div>
                   <ChartLineUp size={16} color="var(--color-text-secondary)" />
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                   <div style={{ position: "absolute", top: "1rem", left: "1rem", right: "1rem", bottom: "1rem" }}>
                      <Chart data={chartData} theme="light" />
                   </div>
                </div>
             </div>
             
             {/* Summary Data Sidebar */}
             <div style={{ flex: "1", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                
                {/* Index Market Breadth */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Index Market Breadth</span>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "20px", backgroundColor: activeIdx.isUp ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: activeIdx.isUp ? "var(--color-positive)" : "var(--color-negative)", fontSize: "0.7rem", fontWeight: 700 }}>
                         {activeIdx.isUp ? "NET POSITIVE" : "NET NEGATIVE"}
                      </span>
                   </div>
                   
                   {/* Advancers vs Decliners Bar */}
                   <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                         <span style={{ color: "var(--color-positive)" }}>{activeIdx.isUp ? "342" : "184"} Advancing</span>
                         <span style={{ color: "var(--color-negative)" }}>{activeIdx.isUp ? "150" : "308"} Declining</span>
                      </div>
                      <div style={{ height: "8px", width: "100%", borderRadius: "4px", overflow: "hidden", display: "flex", backgroundColor: "var(--color-border)" }}>
                         <div style={{ width: activeIdx.isUp ? "68%" : "37%", height: "100%", backgroundColor: "var(--color-positive)", transition: "width 0.3s ease" }} />
                         <div style={{ flex: 1, height: "100%", backgroundColor: "var(--color-negative)", transition: "width 0.3s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-tertiary)", marginTop: "0.3rem", fontWeight: 500 }}>
                         <span>{activeIdx.isUp ? "68.4%" : "36.8%"} of index</span>
                         <span>8 Unchanged</span>
                         <span>{activeIdx.isUp ? "30.0%" : "61.6%"} of index</span>
                      </div>
                   </div>

                   {/* Concrete Financial Explanation */}
                   <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: "1.4", backgroundColor: "var(--color-bg)", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Breadth Analysis: </span> 
                      {activeIdx.isUp 
                        ? "Broad market participation is driving today's gains, indicating healthy underlying liquidity across constituent sectors."
                        : "Over 60% of constituent stocks are declining today, confirming downward index momentum and weakness across most sectors."}
                   </div>
                </div>
                
                <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

                {/* Key Value Pairs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>Previous Close</span>
                      <span style={{ fontWeight: 600 }}>7,428.78</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>Open</span>
                      <span style={{ fontWeight: 600 }}>7,418.16</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>Volume</span>
                      <span style={{ fontWeight: 600 }}>1.80B</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>Market Cap</span>
                      <span style={{ fontWeight: 600 }}>45.2T</span>
                   </div>
                </div>

             </div>
          </div>
          
          {/* BOTTOM ROW: Contextual Table */}
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
             <ContextualTable activeIdx={activeIdx} />
          </div>

       </div>
     </div>
  );
}
