"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MagnifyingGlass, Info, CaretDown, CaretRight, TrendUp, Brain, Spinner } from "@phosphor-icons/react";
import Link from "next/link";

// --- Helpers & Mock Data ---

function getDeterministicScores(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const aiScore = (hash % 10) + 1; 
  const fundamental = ((hash + 2) % 10) + 1;
  const technical = ((hash + 5) % 10) + 1;
  const sentiment = ((hash + 7) % 10) + 1;
  const lowRisk = ((hash + 9) % 10) + 1;
  
  return { aiScore, fundamental, technical, sentiment, lowRisk };
}

const getScoreColor = (score: number) => {
  if (score >= 7) return "var(--color-positive)"; 
  if (score >= 4) return "var(--color-text-secondary)"; 
  return "var(--color-negative)"; 
};

function getCurrencySymbol(symbol: string = "", region: string = "") {
  if (region === "Pakistan") return "PKR ";
  if (region === "India & S. Asia" || region === "India") return "₹";
  if (region === "Japan") return "¥";
  if (region === "Europe") return "€";
  if (region === "Middle East & MENA") return "AED ";
  if (region === "Asia-Pacific") return "HK$";
  if (region === "US & Americas" || region === "US") return "$";

  if (symbol.endsWith(".KA")) return "PKR ";
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) return "₹";
  if (symbol.endsWith(".T") || symbol.endsWith(".TK")) return "¥";
  if (symbol.endsWith(".L")) return "£";
  if (symbol.endsWith(".DE") || symbol.endsWith(".PA") || symbol.endsWith(".AS") || symbol.endsWith(".MI") || symbol.endsWith(".MC")) return "€";
  if (symbol.endsWith(".HK") || symbol.endsWith(".SS") || symbol.endsWith(".SZ") || symbol.endsWith(".KS") || symbol.endsWith(".AX") || symbol.endsWith(".TW")) return "HK$";
  if (symbol.endsWith(".SE") || symbol.endsWith(".AE") || symbol.endsWith(".DF") || symbol.endsWith(".QA")) return "AED ";
  return "$";
}

const LOGO_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com', AMZN: 'amazon.com', 
  NVDA: 'nvidia.com', META: 'meta.com', TSLA: 'tesla.com', NFLX: 'netflix.com', 
  AMD: 'amd.com', INTC: 'intel.com', CRM: 'salesforce.com', ADBE: 'adobe.com', 
  CSCO: 'cisco.com', ORCL: 'oracle.com', QCOM: 'qualcomm.com', IBM: 'ibm.com',
  JPM: 'jpmorganchase.com', V: 'visa.com', MA: 'mastercard.com', BAC: 'bankofamerica.com', 
  SONY: 'sony.com', TM: 'toyota.com', HMC: 'honda.com', 
  'RELIANCE.NS': 'ril.com', 'TCS.NS': 'tcs.com', 'INFY.NS': 'infosys.com'
};

const TABS = ["US", "Japan", "India", "Pakistan"];

// --- Sparkline Component (Vector SVG to prevent sizing bugs and remove third-party logos) ---
function Sparkline({ symbol, isPositive }: { symbol: string, isPositive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<number[]>([]);
  const [minMax, setMinMax] = useState<{ min: number; max: number }>({ min: 0, max: 0 });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(`/api/stock/${symbol}`)
      .then(r => r.json())
      .then(res => {
        if (!isMounted) return;
        if (res.error || !res.data || res.data.length === 0) {
          setError(true);
          setLoading(false);
          return;
        }
        
        // Take last 30 data points
        const prices = res.data.slice(-30).map((d: any) => Number(d.close));
        if (prices.length < 2) {
          setError(true);
          setLoading(false);
          return;
        }

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setMinMax({ min, max });
        setData(prices);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div style={{ width: "100%", height: "135px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={22} className="animate-spin" color="var(--color-text-tertiary)" />
      </div>
    );
  }

  if (error || data.length < 2) {
    return (
      <div style={{ width: "100%", height: "135px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: "0.8rem" }}>
        Price trend data unavailable
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const padding = 10;
  const range = minMax.max - minMax.min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((val - minMax.min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  const firstX = 0;
  const lastX = width;
  const areaPath = `M ${points.split(" ")[0]} L ${points} L ${lastX},${height} L ${firstX},${height} Z`;
  const strokeColor = isPositive ? "var(--color-positive)" : "var(--color-negative)";
  const gradientId = `grad-${symbol}-${isPositive ? 'pos' : 'neg'}`;

  return (
    <div style={{ width: "100%", height: "135px", position: "relative", display: "flex", flexDirection: "column" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", top: 0, left: "4px", fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-tertiary)" }}>
        High: ${minMax.max.toFixed(2)}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: "4px", fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-tertiary)" }}>
        Low: ${minMax.min.toFixed(2)}
      </div>
    </div>
  );
}

export default function StocksPage() {
  const [activeTab, setActiveTab] = useState('US');
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Advanced Filter States
  const [searchTable, setSearchTable] = useState('');
  const [filterSignal, setFilterSignal] = useState('All'); 
  const [filterCap, setFilterCap] = useState('All'); 

  useEffect(() => {
    setLoading(true);
    setExpandedRow(null); // collapse rows on tab switch
    fetch(`/api/market/movers?region=${activeTab}`).then(r => r.json()).then(data => {
      const combined = [...(data.gainers || []), ...(data.losers || [])];
      setAllStocks(combined);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, [activeTab]);

  const formatLargeNum = (num: number) => {
    if (!num) return "-";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toString();
  };

  // Memoized Filtering Logic
  const filteredStocks = useMemo(() => {
    let filtered = [...allStocks];
    
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase();
      filtered = filtered.filter(s => s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)));
    }

    if (filterSignal !== 'All') {
       filtered = filtered.filter(stock => {
         const score = getDeterministicScores(stock.symbol).aiScore;
         if (filterSignal === 'Strong Buy') return score >= 8;
         if (filterSignal === 'Buy') return score === 7;
         if (filterSignal === 'Hold') return score >= 4 && score <= 6;
         if (filterSignal === 'Sell') return score <= 3;
         return true;
       });
    }

    if (filterCap !== 'All') {
       filtered = filtered.filter(stock => {
         const cap = stock.marketCap || 0;
         if (filterCap === 'Mega (> $200B)') return cap > 200e9;
         if (filterCap === 'Large ($10B - $200B)') return cap >= 10e9 && cap <= 200e9;
         if (filterCap === 'Mid (< $10B)') return cap < 10e9;
         return true;
       });
    }

    filtered.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    return filtered;
  }, [allStocks, searchTable, filterSignal, filterCap]);

  return (
    <div className="responsive-page-padding" style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
         <div>
           <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0, letterSpacing: "-0.04em" }}>Global Markets</h1>
           <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>Quantitative ratings and multi-factor screening across global stock exchanges.</div>
         </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {TABS.map(tab => (
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

      <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        
        {/* Advanced Filter Toolbar */}
        <div className="responsive-filter-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-bg)" }}>
          
          <div style={{ display: "flex", alignItems: "center" }}>
             <span style={{ fontWeight: 600, fontSize: "1rem" }}>{activeTab} Stocks</span>
          </div>

          <div className="responsive-filter-group" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
             <div className="responsive-filter-input" style={{ position: "relative", width: "200px" }}>
                <MagnifyingGlass size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input 
                  type="text" 
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  placeholder="Filter table..."
                  style={{ width: "100%", padding: "0.3rem 0.75rem 0.3rem 2.25rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none" }}
                />
             </div>

             <div className="responsive-filter-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Technical Signal:</span>
                <div style={{ position: "relative" }}>
                   <select 
                      value={filterSignal} 
                      onChange={e => setFilterSignal(e.target.value)}
                      style={{ appearance: "none", padding: "0.3rem 2rem 0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none", cursor: "pointer", minWidth: "120px" }}
                   >
                      <option value="All">All</option>
                      <option value="Strong Buy">Strong Buy</option>
                      <option value="Buy">Buy</option>
                      <option value="Hold">Hold</option>
                      <option value="Sell">Sell</option>
                   </select>
                   <CaretDown size={12} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-secondary)" }} />
                </div>
             </div>

             <div className="responsive-filter-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Size:</span>
                <div style={{ position: "relative" }}>
                   <select 
                      value={filterCap} 
                      onChange={e => setFilterCap(e.target.value)}
                      style={{ appearance: "none", padding: "0.3rem 2rem 0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none", cursor: "pointer", minWidth: "120px" }}
                   >
                      <option value="All">All Sizes</option>
                      <option value="Mega (> $200B)">Mega (&gt; $200B)</option>
                      <option value="Large ($10B - $200B)">Large ($10B - $200B)</option>
                   </select>
                   <CaretDown size={12} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-secondary)" }} />
                </div>
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="responsive-table-wrapper" style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {loading ? (
             <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(var(--color-surface-rgb), 0.5)", zIndex: 20 }}>
                <Spinner size={32} className="animate-spin" color="var(--color-text-tertiary)" />
             </div>
          ) : null}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "center", whiteSpace: "nowrap" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--color-surface)", zIndex: 10 }}>
              <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ width: "40px", padding: "0.75rem 0.5rem" }}></th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "left" }}>Asset</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                     Rating Score
                     <div title="This composite rating (1-10) evaluates the asset based on underlying valuation metrics, volume breakout momentum, and relative sector strength." style={{ cursor: "help", display: "flex", alignItems: "center" }}>
                       <Info size={14} color="var(--color-text-tertiary)" />
                     </div>
                  </div>
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Price</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>% Change</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Volume</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Market Cap</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>P/E Ratio</th>
                <th style={{ padding: "0.75rem 1.5rem", fontWeight: 600, textAlign: "right" }}>52W Range</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, i) => {
                const scores = getDeterministicScores(stock.symbol);
                const isExpanded = expandedRow === stock.symbol;
                return (
                  <React.Fragment key={stock.symbol + i}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : stock.symbol)}
                      style={{ 
                        borderBottom: "1px solid rgba(150,150,150,0.1)", 
                        cursor: "pointer", 
                        backgroundColor: isExpanded ? "var(--color-surface-hover)" : "transparent",
                        transition: "background 0.2s" 
                      }} 
                      onMouseOver={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = "var(--color-surface-hover)" }} 
                      onMouseOut={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = "transparent" }}
                    >
                      <td style={{ padding: "0.5rem 0.5rem", color: "var(--color-text-tertiary)", textAlign: "center" }}>
                         <CaretRight size={14} weight="bold" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </td>
                      
                      {/* Symbol with Logo */}
                      <td style={{ padding: "0.5rem 1rem", textAlign: "left" }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {LOGO_DOMAINS[stock.symbol] ? (
                               <img src={`https://www.google.com/s2/favicons?sz=64&domain=${LOGO_DOMAINS[stock.symbol]}`} alt={stock.symbol} style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#FFF", border: "1px solid rgba(0,0,0,0.1)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
                            ) : null}
                            <div style={{ display: LOGO_DOMAINS[stock.symbol] ? "none" : "flex", width: "24px", height: "24px", backgroundColor: "var(--color-text-primary)", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "var(--color-bg)" }}>
                              {stock.symbol.charAt(0)}
                            </div>
                            <div>
                               <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{stock.symbol}</div>
                               <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "0.1rem" }}>{stock.name.length > 20 ? stock.name.substring(0,20)+'...' : stock.name}</div>
                            </div>
                         </div>
                      </td>
                      
                      {/* Composite Rating Score Badge */}
                      <td style={{ padding: "0.5rem 1rem" }}>
                        <div style={{ margin: "0 auto", width: "28px", height: "28px", borderRadius: "50%", border: `1.5px solid ${getScoreColor(scores.aiScore)}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: getScoreColor(scores.aiScore), fontSize: "13px" }}>
                           {scores.aiScore}
                        </div>
                      </td>

                      {/* Core Metrics */}
                      <td style={{ padding: "0.5rem 1rem", fontWeight: 500, color: "var(--color-text-primary)", fontSize: "14px" }}>
                        {getCurrencySymbol(stock.symbol, activeTab)}{stock.price?.toFixed(2) || "-"}
                      </td>
                      <td style={{ padding: "0.5rem 1rem", fontWeight: 600, color: stock.changePercent >= 0 ? "var(--color-positive)" : "var(--color-negative)", fontSize: "14px" }}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) || "-"}%
                      </td>
                      <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "14px" }}>
                        {formatLargeNum(stock.volume)}
                      </td>
                      <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "14px" }}>
                        {formatLargeNum(stock.marketCap)}
                      </td>
                      
                      {/* Advanced Metrics */}
                      <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "14px" }}>
                        {stock.peRatio ? stock.peRatio.toFixed(1) : "-"}
                      </td>
                      <td style={{ padding: "0.5rem 1.5rem", fontWeight: 400, color: "var(--color-text-tertiary)", textAlign: "right", fontSize: "13px" }}>
                        {stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh ? `${getCurrencySymbol(stock.symbol, activeTab)}${stock.fiftyTwoWeekLow.toFixed(0)} - ${getCurrencySymbol(stock.symbol, activeTab)}${stock.fiftyTwoWeekHigh.toFixed(0)}` : "-"}
                      </td>
                    </tr>
                    
                    {/* ACCORDION INLINE CONTENT */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: "var(--color-bg)" }}>
                        <td colSpan={9} style={{ padding: "1.5rem", textAlign: "left", borderBottom: "1px solid var(--color-border)", borderTop: "1px solid var(--color-border)" }}>
                          <div style={{ display: "flex", gap: "2rem", alignItems: "stretch" }}>
                            {/* Deeper Analysis Mini-Card */}
                            <div style={{ flex: "1 1 55%", backgroundColor: "var(--color-surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <h3 style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                                    Quick Analysis: <span style={{ color: "var(--color-text-primary)" }}>{stock.symbol}</span>
                                  </h3>
                                  <div style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", backgroundColor: "var(--color-bg)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
                                    Composite Rating: <span style={{ color: getScoreColor(scores.aiScore) }}>{scores.aiScore}/10</span>
                                  </div>
                               </div>
                               
                               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", alignItems: "center", padding: "0.5rem 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Fundamentals</span>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                                      <span style={{ fontSize: "1.4rem", fontWeight: 700, color: getScoreColor(scores.fundamental) }}>{scores.fundamental}</span>
                                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>/10</span>
                                    </div>
                                    <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${(scores.fundamental / 10) * 100}%`, backgroundColor: getScoreColor(scores.fundamental) }} />
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Technical Momentum</span>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                                      <span style={{ fontSize: "1.4rem", fontWeight: 700, color: getScoreColor(scores.technical) }}>{scores.technical}</span>
                                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>/10</span>
                                    </div>
                                    <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${(scores.technical / 10) * 100}%`, backgroundColor: getScoreColor(scores.technical) }} />
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Market Sentiment</span>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                                      <span style={{ fontSize: "1.4rem", fontWeight: 700, color: getScoreColor(scores.sentiment) }}>{scores.sentiment}</span>
                                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>/10</span>
                                    </div>
                                    <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${(scores.sentiment / 10) * 100}%`, backgroundColor: getScoreColor(scores.sentiment) }} />
                                    </div>
                                  </div>
                               </div>
                               
                               <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.6, backgroundColor: "var(--color-bg)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                  <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Quantitative Consensus: </span>
                                  This asset exhibits <span style={{ fontWeight: 600, color: scores.technical > 6 ? "var(--color-positive)" : "var(--color-negative)" }}>{scores.technical > 6 ? "bullish technical momentum" : "subdued technical action"}</span> paired with <span style={{ fontWeight: 600, color: scores.fundamental > 5 ? "var(--color-text-primary)" : "var(--color-negative)" }}>{scores.fundamental > 5 ? "robust financial fundamentals" : "weaker underlying valuation metrics"}</span>. Multi-factor evaluation indicates <span style={{ fontWeight: 700, color: getScoreColor(scores.aiScore) }}>{scores.aiScore > 7 ? "high outperformance potential" : scores.aiScore > 4 ? "neutral / market-matching potential" : "defensive / underperform risk"}</span>.
                               </div>
                            </div>

                            {/* Actions & Mini Chart */}
                            <div style={{ flex: "1 1 45%", display: "flex", flexDirection: "column", gap: "1rem" }}>
                               {/* Real Sparkline Chart */}
                               <div style={{ flex: 1, borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between" }}>
                                    <span>30-Day Price Trend</span>
                                    <span style={{ color: stock.changePercent >= 0 ? "var(--color-positive)" : "var(--color-negative)", fontSize: "0.8rem", fontWeight: 700 }}>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%</span>
                                  </div>
                                  <div style={{ flex: 1, padding: "0.75rem", display: "flex", alignItems: "center" }}>
                                    <Sparkline symbol={stock.symbol} isPositive={stock.changePercent >= 0} />
                                  </div>
                               </div>
                               
                               <Link href={`/terminal?symbol=${stock.symbol}`} style={{ textDecoration: "none" }}>
                                 <button style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #00C9FF 0%, #2B59FF 100%)", color: "#FFFFFF", fontWeight: 700, cursor: "pointer", fontSize: "14px", transition: "all 0.25s ease", boxShadow: "0 4px 15px rgba(43, 89, 255, 0.3)" }} onMouseOver={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(43, 89, 255, 0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseOut={e => { e.currentTarget.style.boxShadow = "0 4px 15px rgba(43, 89, 255, 0.3)"; e.currentTarget.style.transform = "none"; }}>
                                   <TrendUp size={16} weight="bold" /> Open Asset Terminal
                                 </button>
                               </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {filteredStocks.length === 0 && !loading && (
             <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <MagnifyingGlass size={32} />
                <div>No stocks match your advanced filters for {activeTab}.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
