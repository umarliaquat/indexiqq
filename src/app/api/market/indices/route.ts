import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    const symbols = ["^GSPC", "^IXIC", "^DJI", "^RUT", "BTC-USD", "GC=F", "CL=F", "^N225", "^FTSE", "^VIX", "^BSESN", "^KSE"];
    // In yahoo-finance2 v3, we use quote
    const quotes = await yahooFinance.quote(symbols);
    
    const formatted = quotes.map((q: any) => ({
      symbol: q.symbol,
      shortName: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error(`Failed to fetch indices:`, error);
    return NextResponse.json(
      { error: "Failed to fetch indices", details: error.message },
      { status: 500 }
    );
  }
}
