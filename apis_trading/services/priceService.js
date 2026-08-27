const axios = require("axios");
const WebSocket = require("ws");
const { binanceSymbols, BY_BINANCE, getAsset } = require("../config/assets");

/**
 * The single source of market prices for the whole API.
 *
 * Nothing else may call Binance. Order fills, portfolio valuation, watchlist
 * rows and the live market table all read this one in-memory cache, which is
 * what guarantees two pages can never disagree about the price of an asset.
 * It also means one upstream connection for the whole server rather than one
 * per browser tab.
 */

const REST_BASE = "https://api.binance.com/api/v3";
const WS_BASE = "wss://stream.binance.com:9443/stream";

// Poll interval used only until the socket is up, and as the fallback if it
// stays down. The socket pushes far faster than this when connected.
const POLL_MS = 15_000;
const RECONNECT_MIN_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

// A price older than this is not trustworthy enough to fill an order against
const STALE_AFTER_MS = 90_000;

/** symbol -> { symbol, price, change, changePercent, high, low, volume, at } */
const tickers = new Map();

let socket = null;
let pollTimer = null;
let reconnectTimer = null;
let reconnectDelay = RECONNECT_MIN_MS;
let started = false;

const nowMs = () => Date.now();

const putTicker = (binanceSymbol, data) => {
  const asset = BY_BINANCE.get(binanceSymbol);
  if (!asset) return;

  tickers.set(asset.symbol, {
    symbol: asset.symbol,
    key: asset.key,
    name: asset.name,
    price: Number(data.price),
    change: Number(data.change ?? 0),
    changePercent: Number(data.changePercent ?? 0),
    high: Number(data.high ?? 0),
    low: Number(data.low ?? 0),
    volume: Number(data.volume ?? 0),
    at: nowMs(),
  });
};

/* ------------------------------------------------------------------ REST */

/** Full 24h snapshot. Used at boot and as the polling fallback. */
const fetchSnapshot = async () => {
  const symbols = binanceSymbols();
  if (!symbols.length) return;

  const { data } = await axios.get(`${REST_BASE}/ticker/24hr`, {
    params: { symbols: JSON.stringify(symbols) },
    timeout: 10_000,
  });

  for (const row of data) {
    putTicker(row.symbol, {
      price: row.lastPrice,
      change: row.priceChange,
      changePercent: row.priceChangePercent,
      high: row.highPrice,
      low: row.lowPrice,
      volume: row.quoteVolume,
    });
  }
};

/* -------------------------------------------------------------- WebSocket */

const streamNames = () =>
  binanceSymbols().map((s) => `${s.toLowerCase()}@ticker`);

const scheduleReconnect = () => {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSocket();
  }, reconnectDelay);

  // Exponential backoff, capped. Reconnecting in a tight loop against an
  // exchange is how an IP gets rate-limited or banned.
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
};

function openSocket() {
  const streams = streamNames();
  if (!streams.length) return;

  try {
    socket = new WebSocket(`${WS_BASE}?streams=${streams.join("/")}`);
  } catch (error) {
    console.error("[priceService] socket construct failed:", error.message);
    return scheduleReconnect();
  }

  socket.on("open", () => {
    reconnectDelay = RECONNECT_MIN_MS;
    console.log(`[priceService] streaming ${streams.length} symbols`);
  });

  socket.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw);
      const t = payload?.data;
      if (!t || !t.s) return;

      putTicker(t.s, {
        price: t.c,
        change: t.p,
        changePercent: t.P,
        high: t.h,
        low: t.l,
        volume: t.q,
      });
    } catch {
      // A single malformed frame must never take the process down
    }
  });

  socket.on("error", (error) => {
    console.error("[priceService] socket error:", error.message);
  });

  socket.on("close", () => {
    socket = null;
    scheduleReconnect();
  });
}

/* ----------------------------------------------------------------- public */

const start = async () => {
  if (started) return;
  started = true;

  try {
    await fetchSnapshot();
  } catch (error) {
    console.error("[priceService] initial snapshot failed:", error.message);
  }

  openSocket();

  // Keeps prices moving even if the socket never connects (blocked egress,
  // proxy, region restriction). The API stays usable either way.
  pollTimer = setInterval(() => {
    fetchSnapshot().catch((error) =>
      console.error("[priceService] poll failed:", error.message),
    );
  }, POLL_MS);
};

const stop = () => {
  started = false;
  if (pollTimer) clearInterval(pollTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (socket) socket.close();
  pollTimer = reconnectTimer = socket = null;
};

const getTicker = (symbol) => tickers.get(String(symbol || "").toUpperCase()) || null;

const getAllTickers = () => [...tickers.values()];

/**
 * Price of one unit in the quote asset.
 *
 * The quote asset is 1 by definition. Returns null when there is no price or
 * the cached one has gone stale — callers must treat null as "cannot price
 * this right now" rather than substituting a default. Filling an order at a
 * guessed price is worse than refusing to fill it.
 */
const getPrice = (symbol) => {
  const asset = getAsset(symbol);
  if (!asset) return null;
  if (asset.isQuote) return 1;

  const ticker = tickers.get(asset.symbol);
  if (!ticker) return null;
  if (nowMs() - ticker.at > STALE_AFTER_MS) return null;

  return ticker.price;
};

const isReady = () => tickers.size > 0;

/** Candles for the chart. Straight passthrough — not worth caching per tf. */
const getCandles = async (symbol, interval = "15m", limit = 100) => {
  const asset = getAsset(symbol);
  if (!asset || !asset.binance) return [];

  const { data } = await axios.get(`${REST_BASE}/klines`, {
    params: { symbol: asset.binance, interval, limit },
    timeout: 10_000,
  });

  return data.map((c) => ({
    time: c[0],
    open: Number(c[1]),
    high: Number(c[2]),
    low: Number(c[3]),
    close: Number(c[4]),
    volume: Number(c[5]),
  }));
};

const getOrderBook = async (symbol, limit = 20) => {
  const asset = getAsset(symbol);
  if (!asset || !asset.binance) return { asks: [], bids: [] };

  const { data } = await axios.get(`${REST_BASE}/depth`, {
    params: { symbol: asset.binance, limit },
    timeout: 10_000,
  });

  const map = (rows) =>
    rows.map(([price, qty]) => ({ price: Number(price), qty: Number(qty) }));

  return { asks: map(data.asks), bids: map(data.bids) };
};

module.exports = {
  start,
  stop,
  getPrice,
  getTicker,
  getAllTickers,
  getCandles,
  getOrderBook,
  isReady,
  STALE_AFTER_MS,
};
