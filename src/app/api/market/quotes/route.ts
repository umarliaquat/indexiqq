import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const quotes = await yahooFinance.quote(symbols);
    
    const formatted = quotes.map((q: any) => ({
      symbol: q.symbol,
      shortName: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume,
      marketCap: q.marketCap
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error('Yahoo Finance Quotes Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
