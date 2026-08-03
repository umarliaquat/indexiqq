export type DataPoint = { time: string; value: number };
export type CandleData = { time: string; open: number; high: number; low: number; close: number; value?: number; volume?: number };

export function calculateSMA(data: CandleData[], period: number): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

export function calculateEMA(data: CandleData[], period: number): DataPoint[] {
  const result: DataPoint[] = [];
  const k = 2 / (period + 1);
  
  if (data.length < period) return result;

  // Initial EMA is just SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  result.push({ time: data[period - 1].time, value: prevEma });

  for (let i = period; i < data.length; i++) {
    const ema = (data[i].close - prevEma) * k + prevEma;
    result.push({ time: data[i].time, value: ema });
    prevEma = ema;
  }
  
  return result;
}
