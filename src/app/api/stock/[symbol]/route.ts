import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

// In case of corporate proxies or local SSL issues when fetching from Yahoo API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Instantiate the v3 client
const yahooFinance = new YahooFinance();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  // Await the params object in Next.js 15+ App Router
  const { symbol } = await params;
  const uppercaseSymbol = symbol.toUpperCase();
  
  try {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    const queryOptions = {
      period1: twoYearsAgo.toISOString().split("T")[0],
      interval: "1d" as const,
    };
    
    // Use .chart() instead of .historical() in v3
    const result = await yahooFinance.chart(uppercaseSymbol, queryOptions);
    
    // Format for lightweight-charts: time (YYYY-MM-DD), open, high, low, close, volume
    const formattedData = result.quotes.map((quote: any) => ({
      time: new Date(quote.date).toISOString().split("T")[0],
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      value: quote.close, 
      volume: quote.volume,
    })).filter((quote: any) => quote.close !== null && quote.close !== undefined);

    // lightweight-charts requires strictly ascending time order
    formattedData.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({ symbol: uppercaseSymbol, data: formattedData });
  } catch (error: any) {
    console.error(`Failed to fetch data for ${uppercaseSymbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch stock data", details: error.message },
      { status: 500 }
    );
  }
}
