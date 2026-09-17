// Live token data from Birdeye/DexScreener doesn't come with a 24h price
// history from a single REST call (that needs a separate OHLCV/candles
// endpoint — a good follow-up). Until then, this renders a flat-ish line
// so the sparkline column isn't empty, using the token's real 24h change
// to decide which way it leans.
export const flatSpark = (positive) =>
  Array.from({ length: 24 }, (_, i) => ({ i, v: 50 + (positive ? 1 : -1) * Math.sin(i * 0.5) * 3 }));
