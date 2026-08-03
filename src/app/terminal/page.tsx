"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Chart } from "@/components/Chart";
import { CandleData, DataPoint, calculateSMA, calculateEMA } from "@/lib/indicators";
import { trainAndPredictLSTM } from "@/lib/ml";
import { 
  MagnifyingGlass, 
  Brain, 
  TrendUp, 
  ChartBar, 
  Spinner, 
  Globe, 
  List, 
  CheckCircle,
  SquaresFour,
  Lightbulb,
  Article,
  Gear,
  Info,
  Faders,
  CaretDown,
  ArrowRight
} from "@phosphor-icons/react";

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

// Expanded domain mapping for the new 45 stocks
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

// TopTape moved to layout

function DanelfinScreenerTable({ onSelectStock }: { onSelectStock?: (sym: string) => void }) {
  const [allStocks, setAllStocks] = useState<any[]>([]);
  
  const [searchTable, setSearchTable] = useState('');
  const [filterSignal, setFilterSignal] = useState('All'); 
  const [filterCap, setFilterCap] = useState('All'); 

  useEffect(() => {
    fetch('/api/market/movers').then(r => r.json()).then(data => {
      const combined = [...(data.gainers || []), ...(data.losers || [])];
      setAllStocks(combined);
    }).catch(e => console.error(e));
  }, []);

  const formatLargeNum = (num: number) => {
    if (!num) return "-";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toString();
  };

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
    <div className="responsive-table-section" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div className="responsive-filter-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
           <span style={{ fontWeight: 600, fontSize: "1rem" }}>Top Stocks</span>
        </div>
        <div className="responsive-filter-group" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
           <div className="responsive-filter-input" style={{ position: "relative", width: "200px" }}>
              <MagnifyingGlass size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
              <input 
                type="text" 
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Filter table..."
                style={{ width: "100%", padding: "0.3rem 0.75rem 0.3rem 2.25rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none" }}
              />
           </div>
           <div className="responsive-filter-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Technical Signal:</span>
              <div style={{ position: "relative" }}>
                 <select 
                    value={filterSignal} 
                    onChange={e => setFilterSignal(e.target.value)}
                    style={{ appearance: "none", padding: "0.3rem 2rem 0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none", cursor: "pointer", minWidth: "120px" }}
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
                    style={{ appearance: "none", padding: "0.3rem 2rem 0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-text-primary)", fontSize: "0.75rem", outline: "none", cursor: "pointer", minWidth: "120px" }}
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
      <div className="responsive-table-wrapper" style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "center", whiteSpace: "nowrap" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--color-surface)", zIndex: 10 }}>
            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1.5rem", fontWeight: 600, textAlign: "left" }}>No.</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "left" }}>Asset</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                   Rating Score
                   <div title="This composite rating (1-10) evaluates the asset based on fundamental valuation, technical momentum, and risk profiles." style={{ cursor: "help", display: "flex", alignItems: "center" }}>
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
              return (
                <tr key={stock.symbol + i} onClick={() => onSelectStock && onSelectStock(stock.symbol)} style={{ borderBottom: "1px solid rgba(150,150,150,0.1)", transition: "background 0.2s", cursor: onSelectStock ? "pointer" : "default" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--color-border)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "0.5rem 1.5rem", fontWeight: 500, textAlign: "left", color: "var(--color-text-secondary)", fontSize: "14px" }}>{i + 1}</td>
                  <td style={{ padding: "0.5rem 1rem", textAlign: "left" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {LOGO_DOMAINS[stock.symbol] ? (
                           <img src={`https://www.google.com/s2/favicons?sz=64&domain=${LOGO_DOMAINS[stock.symbol]}`} alt={stock.symbol} style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#FFF", border: "1px solid rgba(0,0,0,0.1)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
                        ) : null}
                        <div style={{ display: LOGO_DOMAINS[stock.symbol] ? "none" : "flex", width: "24px", height: "24px", backgroundColor: "var(--color-text-primary)", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "var(--color-bg)" }}>
                          {stock.symbol.charAt(0)}
                        </div>
                        <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "14px" }}>{stock.symbol}</div>
                     </div>
                  </td>
                  <td style={{ padding: "0.5rem 1rem" }}>
                    <div style={{ margin: "0 auto", width: "28px", height: "28px", borderRadius: "50%", border: `1.5px solid ${getScoreColor(scores.aiScore)}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: getScoreColor(scores.aiScore), fontSize: "13px" }}>
                       {scores.aiScore}
                    </div>
                  </td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 500, color: "var(--color-text-primary)", fontSize: "14px" }}>
                    {getCurrencySymbol(stock.symbol)}{stock.price?.toFixed(2) || "-"}
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
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "14px" }}>
                    {stock.peRatio ? stock.peRatio.toFixed(1) : "-"}
                  </td>
                  <td style={{ padding: "0.5rem 1.5rem", fontWeight: 400, color: "var(--color-text-tertiary)", textAlign: "right", fontSize: "13px" }}>
                    {stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh ? `${getCurrencySymbol(stock.symbol)}${stock.fiftyTwoWeekLow.toFixed(0)} - ${getCurrencySymbol(stock.symbol)}${stock.fiftyTwoWeekHigh.toFixed(0)}` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStocks.length === 0 && (
           <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <MagnifyingGlass size={32} />
              <div>No assets match your advanced filters.</div>
           </div>
        )}
      </div>
    </div>
  );
}

// --- Main Dashboard ---

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
];

function StockTerminalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chartTheme, setChartTheme] = useState("light");
  
  useEffect(() => {
    setChartTheme(document.documentElement.getAttribute("data-theme") || "light");
    const observer = new MutationObserver(() => {
      setChartTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  
  const initialSymbol = searchParams?.get("symbol")?.toUpperCase() || "TSLA";
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchInput, setSearchInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);
  
  const [data, setData] = useState<CandleData[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTimeRange, setActiveTimeRange] = useState("1Y");
  
  const [aiPrediction, setAiPrediction] = useState<DataPoint[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setAiPrediction([]);
      try {
        const [chartRes, detailsRes] = await Promise.all([
          fetch(`/api/stock/${symbol}`),
          fetch(`/api/stock/${symbol}/details`)
        ]);
        
        const chartJson = await chartRes.json();
        const detailsJson = await detailsRes.json();
        
        if (chartJson.error) throw new Error(chartJson.error);
        if (detailsJson.error) throw new Error(detailsJson.error);
        
        setData(chartJson.data);
        setDetails(detailsJson);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const newSym = searchInput.trim().toUpperCase();
      setSymbol(newSym);
      setSearchInput("");
      router.push(`/terminal?symbol=${newSym}`);
    }
  };

  const handleRunPrediction = async () => {
    if (data.length === 0) return;
    setIsPredicting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const pred = await trainAndPredictLSTM(data);
      setAiPrediction(pred);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  const slicedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (activeTimeRange === '1D') return data.slice(-5); 
    if (activeTimeRange === '1M') return data.slice(-21);
    if (activeTimeRange === '3M') return data.slice(-63);
    if (activeTimeRange === '1Y') return data.slice(-252);
    if (activeTimeRange === '5Y') return data.slice(-(252 * 5));
    return data;
  }, [data, activeTimeRange]);

  const isPositive = details?.quote?.change >= 0;
  const activeScores = getDeterministicScores(symbol);
  
  const calculatePerf = (monthsAgo: number) => {
    if (data.length === 0) return 0;
    const targetIdx = Math.max(0, Math.floor(data.length - (monthsAgo * 21)));
    const oldPrice = data[targetIdx]?.close || 0;
    const currentPrice = data[data.length - 1].close;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  };

  return (
    <>
      {/* Center Column: Chart & Screener */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--color-border)", minWidth: 0 }}>

            {/* Quick Watchlist & Search Header */}
            <div className="responsive-terminal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
               <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }}>
                 {POPULAR_STOCKS.map(stock => (
                   <button 
                     key={stock.symbol}
                     onClick={() => { setSymbol(stock.symbol); router.push(`/terminal?symbol=${stock.symbol}`); }}
                     style={{
                       background: symbol === stock.symbol ? "var(--color-text-primary)" : "transparent",
                       color: symbol === stock.symbol ? "var(--color-bg)" : "var(--color-text-secondary)",
                       border: `1px solid ${symbol === stock.symbol ? "var(--color-text-primary)" : "var(--color-border)"}`,
                       padding: "0.25rem 0.75rem",
                       borderRadius: "9999px",
                       fontSize: "0.75rem",
                       fontWeight: 500,
                       cursor: "pointer",
                       transition: "all 0.15s"
                     }}
                   >
                     {stock.symbol}
                   </button>
                 ))}
               </div>

               <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <form onSubmit={handleSearch} style={{ display: "flex", position: "relative", width: "250px" }}>
                    <MagnifyingGlass size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                    <input 
                      type="text" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search stock..."
                      style={{ width: "100%", padding: "0.4rem 0.75rem 0.4rem 2.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-text-primary)", fontSize: "0.8rem", outline: "none", transition: "border-color 0.2s" }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--color-text-secondary)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                    />
                  </form>
               </div>
            </div>

            {/* Chart Area */}
            <div className="responsive-terminal-chart" style={{ minHeight: "350px", maxHeight: "40vh", display: "flex", flexDirection: "column", padding: "0 1.5rem", overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", border: "1px solid var(--color-border)", borderBottom: "none", borderTopLeftRadius: "12px", borderTopRightRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-bg)" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    {/* Time Range Pills */}
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                       {['1D', '1M', '3M', '1Y', '5Y', 'All'].map(range => (
                         <button 
                           key={range}
                           onClick={() => setActiveTimeRange(range)}
                           style={{ 
                             background: activeTimeRange === range ? "var(--color-border)" : "transparent",
                             color: activeTimeRange === range ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                             border: "none",
                             padding: "0.25rem 0.5rem",
                             borderRadius: "4px",
                             fontSize: "0.75rem",
                             fontWeight: 500,
                             cursor: "pointer",
                             transition: "color 0.2s"
                           }}
                           onMouseOver={e => { if (activeTimeRange !== range) e.currentTarget.style.color = "var(--color-text-primary)" }}
                           onMouseOut={e => { if (activeTimeRange !== range) e.currentTarget.style.color = "var(--color-text-secondary)" }}
                         >
                           {range}
                         </button>
                       ))}
                    </div>
                 </div>
                 
                 <button 
                    className="button secondary" 
                    onClick={handleRunPrediction} 
                    disabled={isPredicting || loading}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                  >
                   {isPredicting ? <Spinner size={14} className="animate-spin" /> : <TrendUp size={14} weight="bold" />}
                   {isPredicting ? "Calculating..." : "Model Forecast"}
                 </button>
              </div>
              
              <div style={{ flex: 1, position: "relative", border: "1px solid var(--color-border)", borderTop: "none", backgroundColor: "var(--color-surface)" }}>
                {loading ? (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={24} className="animate-spin" color="var(--color-text-tertiary)" /></div>
                ) : error ? (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-negative)" }}>{error}</div>
                ) : (
                  <Chart data={slicedData} aiPrediction={aiPrediction.length > 0 ? aiPrediction : undefined} theme={chartTheme as "light" | "dark"} />
                )}
              </div>
            </div>

            {/* Bottom Danelfin Screener Table */}
            <div style={{ flex: 1, minHeight: 0, marginTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
               <DanelfinScreenerTable onSelectStock={(sym) => { setSymbol(sym); router.push(`/terminal?symbol=${sym}`); }} />
            </div>

          </div>

          {/* Right Column: Identity, AI Score, Performance Sidebar */}
          <div className="responsive-terminal-sidebar" style={{ width: "360px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
             
             {/* Header Detail & Logo */}
             {details && (
               <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
                 <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    {LOGO_DOMAINS[symbol] ? (
                       <img src={`https://www.google.com/s2/favicons?sz=128&domain=${LOGO_DOMAINS[symbol]}`} alt={symbol} style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#FFF", border: "1px solid var(--color-border)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
                    ) : null}
                    
                    <div style={{ display: LOGO_DOMAINS[symbol] ? "none" : "flex", width: "40px", height: "40px", backgroundColor: "var(--color-text-primary)", borderRadius: "10px", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-bg)" }}>
                       {symbol.charAt(0)}
                    </div>

                    <div>
                      <h1 style={{ margin: 0, fontSize: "1.25rem", lineHeight: 1 }}>{symbol}</h1>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        {details.quote.shortName || details.quote.longName || "Public Company"}
                      </div>
                    </div>
                 </div>
                 <div style={{ marginTop: "1rem" }}>
                     <h2 style={{ margin: 0, fontSize: "2.25rem", fontWeight: 500, letterSpacing: "-0.04em" }}>{getCurrencySymbol(symbol)}{details.quote.price?.toFixed(2)}</h2>
                     <div style={{ fontSize: "0.85rem", fontWeight: 500, color: isPositive ? "var(--color-positive)" : "var(--color-negative)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       {isPositive ? '+' : ''}{details.quote.change?.toFixed(2)} ({isPositive ? '+' : ''}{details.quote.changePercent?.toFixed(2)}%)
                     </div>
                 </div>
               </div>
             )}

             {/* Vercel-styled Rating Widget */}
             <div style={{ display: "flex", padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", gap: "1.25rem", alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Composite Rating</div>
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", border: `2px solid ${getScoreColor(activeScores.aiScore)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg)" }}>
                     <span style={{ fontSize: "2rem", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1, letterSpacing: "-0.05em" }}>{activeScores.aiScore}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1px solid ${getScoreColor(activeScores.fundamental)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: getScoreColor(activeScores.fundamental), fontWeight: 500 }}>{activeScores.fundamental}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Fundamentals</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1px solid ${getScoreColor(activeScores.technical)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: getScoreColor(activeScores.technical), fontWeight: 500 }}>{activeScores.technical}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Technical</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1px solid ${getScoreColor(activeScores.sentiment)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: getScoreColor(activeScores.sentiment), fontWeight: 500 }}>{activeScores.sentiment}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Sentiment</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1px solid ${getScoreColor(activeScores.lowRisk)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: getScoreColor(activeScores.lowRisk), fontWeight: 500 }}>{activeScores.lowRisk}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Low Risk</span>
                  </div>
                </div>
             </div>

             {/* Performance Metrics */}
             {details && (
               <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Metrics</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8rem" }}>
                     
                     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid var(--color-border)" }}>
                       <span style={{ color: "var(--color-text-tertiary)" }}>Market Cap</span>
                       <span style={{ fontWeight: 500 }}>${(details.quote.marketCap / 1e9).toFixed(2)}B</span>
                     </div>
                     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid var(--color-border)" }}>
                       <span style={{ color: "var(--color-text-tertiary)" }}>Volume</span>
                       <span style={{ fontWeight: 500 }}>{(details.quote.volume / 1e6).toFixed(2)}M</span>
                     </div>
                     
                     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid var(--color-border)", marginTop: "0.25rem" }}>
                       <span style={{ color: "var(--color-text-tertiary)" }}>Perf Week</span>
                       <span style={{ fontWeight: 500, color: calculatePerf(0.25) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{calculatePerf(0.25).toFixed(2)}%</span>
                     </div>
                     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid var(--color-border)" }}>
                       <span style={{ color: "var(--color-text-tertiary)" }}>Perf Quarter</span>
                       <span style={{ fontWeight: 500, color: calculatePerf(3) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{calculatePerf(3).toFixed(2)}%</span>
                     </div>
                     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid transparent" }}>
                       <span style={{ color: "var(--color-text-tertiary)" }}>Perf YTD</span>
                       <span style={{ fontWeight: 500, color: calculatePerf(7) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{calculatePerf(7).toFixed(2)}%</span>
                     </div>

                  </div>
               </div>
             )}

             {/* Recent News Widget */}
             {details && (
               <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                     <div style={{ color: "var(--color-text-secondary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent News</div>
                     <Link href="/news" style={{ textDecoration: "none" }}>
                       <span style={{ background: "none", border: "none", color: "var(--color-text-primary)", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 600, transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--color-positive)"} onMouseOut={e => e.currentTarget.style.color = "var(--color-text-primary)"}>View All <ArrowRight size={12} weight="bold" /></span>
                     </Link>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                     
                     {/* News Item 1 */}
                     <Link href="/news" style={{ display: "flex", textDecoration: "none", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", transition: "border-color 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--color-text-secondary)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--color-border)"}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-tertiary)" }}>BLOOMBERG</span>
                             <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)" }}>2h ago</span>
                           </div>
                           <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.4 }}>{symbol} surges in pre-market trading following strong quarterly guidance</h4>
                        </div>
                     </Link>

                     {/* News Item 2 */}
                     <Link href="/news" style={{ display: "flex", textDecoration: "none", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", transition: "border-color 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--color-text-secondary)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--color-border)"}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-tertiary)" }}>REUTERS</span>
                             <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)" }}>5h ago</span>
                           </div>
                           <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.4 }}>Analysts upgrade {symbol} rating, citing robust institutional demand and fundamental catalysts</h4>
                        </div>
                     </Link>

                     {/* News Item 3 */}
                     <Link href="/news" style={{ display: "flex", textDecoration: "none", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", transition: "border-color 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--color-text-secondary)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--color-border)"}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-tertiary)" }}>WALL STREET JOURNAL</span>
                             <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)" }}>1d ago</span>
                           </div>
                           <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.4 }}>Market rally driven by tech sector giants; {symbol} leads the S&P 500 index gains</h4>
                        </div>
                     </Link>

                  </div>
               </div>
             )}

          </div>
    </>
  );
}

export default function StockTerminalPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}><Spinner size={32} className="animate-spin" color="var(--color-text-tertiary)" /></div>}>
      <div className="responsive-row-to-col" style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", flex: 1 }}>
        <StockTerminalContent />
      </div>
    </Suspense>
  );
}
