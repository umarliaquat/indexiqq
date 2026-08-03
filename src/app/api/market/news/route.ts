import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'SPY';

    // Using yahooFinance.search to get news for a query
    const results = await yahooFinance.search(query, { newsCount: 10 });

    if (!results.news || results.news.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const mappedNews = results.news.map(article => ({
      title: article.title,
      publisher: article.publisher,
      link: article.link,
      providerPublishTime: article.providerPublishTime,
      type: article.type,
      thumbnail: article.thumbnail?.resolutions?.[0]?.url || null
    }));

    return NextResponse.json({ data: mappedNews });
  } catch (error: any) {
    console.error('Yahoo Finance News Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
