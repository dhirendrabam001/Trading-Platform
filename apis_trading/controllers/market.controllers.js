const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const priceService = require("../services/priceService");
const { ASSETS, QUOTE_ASSET, getAsset, pairLabel } = require("../config/assets");

/** GET /api/market/assets — the tradable catalogue */
const getAssets = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    quote: QUOTE_ASSET,
    assets: ASSETS.map(({ symbol, key, name, decimals, isQuote }) => ({
      symbol,
      key,
      name,
      decimals,
      isQuote,
      pair: isQuote ? null : pairLabel(symbol),
    })),
  });
});

/** GET /api/market/tickers — everything the market table and watchlist need */
const getTickers = asyncHandler(async (req, res) => {
  if (!priceService.isReady()) {
    throw new ApiError(503, "Market data is still warming up, try again shortly");
  }

  const tickers = priceService.getAllTickers().map((t) => ({
    ...t,
    pair: pairLabel(t.symbol),
  }));

  res.json({ success: true, quote: QUOTE_ASSET, tickers });
});

/** GET /api/market/ticker/:symbol */
const getTicker = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  if (!getAsset(symbol)) {
    throw ApiError.notFound(`Unknown asset ${symbol}`);
  }

  const ticker = priceService.getTicker(symbol);
  if (!ticker) {
    throw new ApiError(503, `No price available for ${symbol} yet`);
  }

  res.json({ success: true, ticker: { ...ticker, pair: pairLabel(ticker.symbol) } });
});

/** GET /api/market/candles/:symbol?interval=15m&limit=100 */
const getCandles = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { interval, limit } = req.query;

  const asset = getAsset(symbol);
  if (!asset) throw ApiError.notFound(`Unknown asset ${symbol}`);
  if (asset.isQuote) throw ApiError.badRequest(`${symbol} has no chart`);

  const candles = await priceService.getCandles(symbol, interval, limit);
  res.json({ success: true, symbol: asset.symbol, interval, candles });
});

/** GET /api/market/orderbook/:symbol?limit=20 */
const getOrderBook = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { limit } = req.query;

  const asset = getAsset(symbol);
  if (!asset) throw ApiError.notFound(`Unknown asset ${symbol}`);
  if (asset.isQuote) throw ApiError.badRequest(`${symbol} has no order book`);

  const book = await priceService.getOrderBook(symbol, limit);
  res.json({ success: true, symbol: asset.symbol, ...book });
});

module.exports = {
  getAssets,
  getTickers,
  getTicker,
  getCandles,
  getOrderBook,
};
