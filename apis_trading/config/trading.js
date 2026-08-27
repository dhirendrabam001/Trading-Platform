/**
 * Trading rules, in one place.
 *
 * The frontend currently contradicts itself on fees: Orders, ProfitLoss and
 * BuySell assume a flat 0.1% (`FEE_RATE = 0.001`), while TradeHistory assumes
 * maker/taker (`{ Maker: 0.0002, Taker: 0.0005 }`). The server is the
 * authority, and it uses maker/taker — the model an exchange actually has.
 * The three flat-rate pages need updating to read the rate from the API
 * response rather than hardcoding one.
 */

// Fraction of trade value, charged in the quote asset
const FEES = {
  maker: 0.0002, // 0.02% — resting order that adds liquidity
  taker: 0.0005, // 0.05% — order that fills immediately
};

/**
 * Paper trading starting balance.
 *
 * Granted once, the first time an account touches its wallet. Without it a
 * new user has nothing to trade with and every page renders empty.
 */
const DEMO_GRANT = {
  asset: "USDT",
  amount: 100_000,
  refId: "demo-grant",
};

const DEPOSIT = {
  minQuote: 10,
  maxQuote: 250_000,
};

/**
 * Withdrawal limits.
 *
 * `Withdraw.jsx` holds DAILY_LIMIT = 50000 as a frontend constant, which is
 * not a limit — anyone can edit it in the browser. The server value below is
 * the real one; the page should read it from the API.
 */
const WITHDRAWAL = {
  minQuote: 10,
  dailyLimitQuote: 50_000,
};

const ORDER = {
  minNotionalQuote: 5, // smallest order value worth executing
  maxOpenOrders: 50, // per user, stops runaway order spam
};

module.exports = { FEES, DEMO_GRANT, DEPOSIT, WITHDRAWAL, ORDER };
