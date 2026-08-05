"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from "lightweight-charts";
import { CandleData, DataPoint } from "@/lib/indicators";

interface ChartProps {
  data: CandleData[];
  smaData?: DataPoint[];
  emaData?: DataPoint[];
  aiPrediction?: DataPoint[];
  theme?: "light" | "dark";
}

export function Chart({ data, smaData, emaData, aiPrediction, theme = "light" }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const aiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [currentTheme, setCurrentTheme] = useState<string>("light");

  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme") || theme || "light";
    setCurrentTheme(activeTheme);

    const observer = new MutationObserver(() => {
      const updatedTheme = document.documentElement.getAttribute("data-theme") || "light";
      setCurrentTheme(updatedTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = currentTheme === "dark";
    const bg = isDark ? "#0a0a0a" : "#FFFFFF";
    const text = isDark ? "#A1A1AA" : "#6B7280";
    const grid = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: grid,
      },
      timeScale: {
        borderColor: grid,
      },
      autoSize: true,
    });

    chartRef.current = chart;

    // 1. Candlestick Series (v5 syntax)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', // positive
      downColor: '#EF4444', // negative
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });
    if (data.length > 0) candleSeries.setData(data);
    candlestickSeriesRef.current = candleSeries;

    // 2. SMA Series
    const smaSeries = chart.addSeries(LineSeries, {
      color: '#3B82F6', // Blue
      lineWidth: 2,
    });
    if (smaData && smaData.length > 0) smaSeries.setData(smaData);
    smaSeriesRef.current = smaSeries;

    // 3. EMA Series
    const emaSeries = chart.addSeries(LineSeries, {
      color: '#F59E0B', // Orange/Yellow
      lineWidth: 2,
    });
    if (emaData && emaData.length > 0) emaSeries.setData(emaData);
    emaSeriesRef.current = emaSeries;

    // 4. AI Prediction Series (Dotted)
    const aiSeries = chart.addSeries(LineSeries, {
      color: '#8B5CF6', // Purple
      lineWidth: 3,
      lineStyle: 2, // Dashed
    });
    if (aiPrediction && aiPrediction.length > 0) aiSeries.setData(aiPrediction);
    aiSeriesRef.current = aiSeries;

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data, currentTheme]);

  // Handle live theme switches smoothly without re-rendering data series if chart exists
  useEffect(() => {
    if (chartRef.current) {
      const isDark = currentTheme === "dark";
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: isDark ? "#0a0a0a" : "#FFFFFF" },
          textColor: isDark ? "#A1A1AA" : "#6B7280",
        },
        grid: {
          vertLines: { color: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)" },
          horzLines: { color: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)" },
        },
        rightPriceScale: {
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
        },
        timeScale: {
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
        }
      });
    }
  }, [currentTheme]); 

  // Fast updates for toggling overlays without completely destroying the chart
  useEffect(() => {
    if (smaSeriesRef.current) {
      if (smaData && smaData.length > 0) smaSeriesRef.current.setData(smaData);
      else smaSeriesRef.current.setData([]); // Hack to clear
    }
  }, [smaData]);

  useEffect(() => {
    if (emaSeriesRef.current) {
      if (emaData && emaData.length > 0) emaSeriesRef.current.setData(emaData);
      else emaSeriesRef.current.setData([]);
    }
  }, [emaData]);

  useEffect(() => {
    if (aiSeriesRef.current) {
      if (aiPrediction && aiPrediction.length > 0) aiSeriesRef.current.setData(aiPrediction);
      else aiSeriesRef.current.setData([]);
    }
  }, [aiPrediction]);

  return (
    <>
      <style>{`
        .tv-lightweight-charts-logo { display: none !important; }
        a[href*="tradingview.com"] { display: none !important; }
      `}</style>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
