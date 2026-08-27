const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getAssets,
  getTickers,
  getTicker,
  getCandles,
  getOrderBook,
} = require("../controllers/market.controllers");

const router = express.Router();

// Binance's supported intervals. Anything else is rejected here rather than
// being forwarded upstream and coming back as an opaque 400.
const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

const candleQuery = z.object({
  interval: z.enum(INTERVALS).default("15m"),
  limit: z.coerce.number().int().min(10).max(500).default(100),
});

const bookQuery = z.object({
  limit: z.coerce.number().int().min(5).max(100).default(20),
});

const symbolParam = z.object({
  symbol: z.string().min(2).max(10),
});

// Market data is per-account, not public: these endpoints exist to serve the
// signed-in dashboard, and leaving them open turns the server into a free
// proxy for Binance that anyone can point traffic at.
router.use(authMiddleware);

router.get("/assets", getAssets);
router.get("/tickers", getTickers);
router.get("/ticker/:symbol", validate(symbolParam, "params"), getTicker);
router.get(
  "/candles/:symbol",
  validate(symbolParam, "params"),
  validate(candleQuery, "query"),
  getCandles,
);
router.get(
  "/orderbook/:symbol",
  validate(symbolParam, "params"),
  validate(bookQuery, "query"),
  getOrderBook,
);

module.exports = router;
