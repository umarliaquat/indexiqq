import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const yahooFinance = new YahooFinance();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const uppercaseSymbol = symbol.toUpperCase();
  
  try {
    const [quote, searchResult] = await Promise.all([
      yahooFinance.quote(uppercaseSymbol),
      yahooFinance.search(uppercaseSymbol, { newsCount: 5 })
    ]);
    
    return NextResponse.json({
      quote: {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        marketCap: quote.marketCap,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume10Day,
        peRatio: quote.trailingPE,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      },
      news: searchResult.news.map((n: any) => ({
        title: n.title,
        publisher: n.publisher,
        link: n.link,
        time: n.providerPublishTime,
      }))
    });
  } catch (error: any) {
    console.error(`Failed to fetch details for ${uppercaseSymbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch details", details: error.message },
      { status: 500 }
    );
  }
}
