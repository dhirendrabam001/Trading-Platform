/**
 * The tradable asset catalogue.
 *
 * Held as a module constant rather than a Mongo collection: the catalogue is
 * fixed, never edited at runtime, and every balance/order/ledger row keys off
 * the symbol. Storing symbols directly instead of ObjectId references means
 * no populate() on the hottest queries in the app, and no seed step to run
 * before the API works.
 *
 * `key` matches the lowercase key the frontend already uses for its per-coin
 * colours (COIN_COLORS in Wallet, Portfolio, Orders, …), so responses drop
 * straight into the existing components.
 */

// Everything is priced and settled in this asset
const QUOTE_ASSET = "USDT";

const ASSETS = [
  { symbol: "USDT", key: "usdt", name: "Tether",    decimals: 2, isQuote: true,  binance: null },
  { symbol: "BTC",  key: "btc",  name: "Bitcoin",   decimals: 6, isQuote: false, binance: "BTCUSDT" },
  { symbol: "ETH",  key: "eth",  name: "Ethereum",  decimals: 5, isQuote: false, binance: "ETHUSDT" },
  { symbol: "SOL",  key: "sol",  name: "Solana",    decimals: 3, isQuote: false, binance: "SOLUSDT" },
  { symbol: "BNB",  key: "bnb",  name: "BNB",       decimals: 3, isQuote: false, binance: "BNBUSDT" },
  { symbol: "XRP",  key: "xrp",  name: "XRP",       decimals: 2, isQuote: false, binance: "XRPUSDT" },
  { symbol: "ADA",  key: "ada",  name: "Cardano",   decimals: 2, isQuote: false, binance: "ADAUSDT" },
  { symbol: "AVAX", key: "avax", name: "Avalanche", decimals: 3, isQuote: false, binance: "AVAXUSDT" },
  { symbol: "LINK", key: "link", name: "Chainlink", decimals: 3, isQuote: false, binance: "LINKUSDT" },
  { symbol: "DOGE", key: "doge", name: "Dogecoin",  decimals: 1, isQuote: false, binance: "DOGEUSDT" },
  { symbol: "DOT",  key: "dot",  name: "Polkadot",  decimals: 3, isQuote: false, binance: "DOTUSDT" },
  { symbol: "LTC",  key: "ltc",  name: "Litecoin",  decimals: 4, isQuote: false, binance: "LTCUSDT" },
];

const BY_SYMBOL = new Map(ASSETS.map((a) => [a.symbol, a]));
const BY_BINANCE = new Map(
  ASSETS.filter((a) => a.binance).map((a) => [a.binance, a]),
);

const getAsset = (symbol) => BY_SYMBOL.get(String(symbol || "").toUpperCase());
const isTradable = (symbol) => {
  const asset = getAsset(symbol);
  return Boolean(asset && !asset.isQuote);
};

/** Every Binance stream symbol we care about, e.g. ["BTCUSDT", …] */
const binanceSymbols = () => [...BY_BINANCE.keys()];

/** "BTC" -> "BTC/USDT" — the pair label the frontend renders */
const pairLabel = (symbol) => `${String(symbol).toUpperCase()} / ${QUOTE_ASSET}`;

/**
 * Rounds a quantity to the asset's precision.
 *
 * Floating point makes 0.1 + 0.2 = 0.30000000000000004, and left unchecked
 * those trailing digits accumulate through every fill until a balance that
 * should read 0 reads 1e-17 and the UI shows a dust row that cannot be spent.
 */
const roundQty = (symbol, value) => {
  const asset = getAsset(symbol);
  const decimals = asset ? asset.decimals : 8;
  return Number(Number(value).toFixed(decimals));
};

/** Money is always 2dp in the quote asset */
const roundQuote = (value) => Number(Number(value).toFixed(2));

module.exports = {
  ASSETS,
  QUOTE_ASSET,
  getAsset,
  isTradable,
  binanceSymbols,
  pairLabel,
  roundQty,
  roundQuote,
  BY_BINANCE,
};
