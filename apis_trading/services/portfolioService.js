const { Fill } = require("../models/fill.model");
const ledgerService = require("./ledgerService");
const priceService = require("./priceService");
const { LedgerEntry } = require("../models/ledgerEntry.model");
const { getAsset, roundQuote, QUOTE_ASSET } = require("../config/assets");

/**
 * Works out what a user's portfolio is worth and how it has performed.
 *
 * This service only READS. It never writes a balance or a ledger row.
 * Every number here is calculated from data we already have, so it can never
 * disagree with the Wallet page — there is nothing separate to keep in sync.
 */

/* ===================================================================== */
/*  1. HOLDINGS  (Portfolio page)                                        */
/* ===================================================================== */

/**
 * One row per coin the user actually owns.
 *
 * For each coin:
 *   value  = how many coins  x  today's price
 *   cost   = what those coins cost us (kept on the balance as totalCost)
 *   pnl    = value - cost      (profit if positive)
 */
async function getHoldings(userId) {
  const balances = await ledgerService.getBalances(userId);

  const rows = [];
  let cash = 0;

  for (const balance of balances) {
    const asset = getAsset(balance.asset);
    if (!asset) continue;

    const qty = balance.available + balance.locked;

    // USDT is the money we buy with, not a holding we track profit on.
    if (asset.isQuote) {
      cash = roundQuote(qty);
      continue;
    }

    if (qty <= 0) continue;

    const ticker = priceService.getTicker(asset.symbol);
    const price = priceService.getPrice(asset.symbol);

    // No price right now. Show the row, but mark it as unpriced instead of
    // pretending the holding is worth nothing.
    if (price === null) {
      rows.push({
        symbol: asset.symbol,
        key: asset.key,
        name: asset.name,
        qty,
        price: null,
        value: null,
        cost: roundQuote(balance.totalCost),
        avgCost: balance.avgCost,
        pnl: null,
        pnlPercent: null,
        change24: null,
        allocation: 0,
        realisedPnl: balance.realisedPnl,
      });
      continue;
    }

    const value = roundQuote(qty * price);
    const cost = roundQuote(balance.totalCost);
    const pnl = roundQuote(value - cost);

    rows.push({
      symbol: asset.symbol,
      key: asset.key,
      name: asset.name,
      qty,
      price,
      value,
      cost,
      avgCost: balance.avgCost,
      pnl,
      pnlPercent: cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0,
      change24: ticker ? Number(ticker.changePercent.toFixed(2)) : 0,
      allocation: 0, // filled in below, once we know the total
      realisedPnl: balance.realisedPnl,
    });
  }

  // Biggest holding first — that is the order the Portfolio table expects.
  rows.sort((a, b) => (b.value || 0) - (a.value || 0));

  const invested = roundQuote(rows.reduce((sum, r) => sum + (r.value || 0), 0));
  addAllocationPercentages(rows, invested);

  return { rows, cash, invested };
}

/**
 * Works out what share of the portfolio each holding is.
 *
 * The percentages have to add up to exactly 100, otherwise the pie chart and
 * the table disagree. Rounding each one on its own gives totals like 99.98,
 * so we round them all, then give any leftover to the biggest holding.
 */
function addAllocationPercentages(rows, invested) {
  if (invested <= 0) return;

  let runningTotal = 0;

  for (const row of rows) {
    if (row.value === null) continue;
    row.allocation = Number(((row.value / invested) * 100).toFixed(2));
    runningTotal += row.allocation;
  }

  const leftover = Number((100 - runningTotal).toFixed(2));
  const biggest = rows.find((r) => r.value !== null);

  if (biggest && leftover !== 0) {
    biggest.allocation = Number((biggest.allocation + leftover).toFixed(2));
  }
}

/* ===================================================================== */
/*  2. SUMMARY  (Dashboard + Portfolio header)                           */
/* ===================================================================== */

async function getSummary(userId) {
  const { rows, cash, invested } = await getHoldings(userId);

  const costBasis = roundQuote(rows.reduce((sum, r) => sum + (r.cost || 0), 0));
  const unrealisedPnl = roundQuote(invested - costBasis);

  // Yesterday's value, worked backwards out of each coin's 24h move. Doing it
  // this way means the headline change always agrees with the per-row
  // percentages shown in the table.
  const previousValue = rows.reduce((sum, r) => {
    if (r.value === null) return sum;
    return sum + r.value / (1 + (r.change24 || 0) / 100);
  }, 0);

  const change24 = roundQuote(invested - previousValue);

  // Everything the user has ever locked in by selling
  const realisedPnl = roundQuote(
    rows.reduce((sum, r) => sum + (r.realisedPnl || 0), 0),
  );

  return {
    quote: QUOTE_ASSET,
    netWorth: roundQuote(invested + cash),
    cash,
    invested,
    costBasis,
    unrealisedPnl,
    unrealisedPercent:
      costBasis > 0 ? Number(((unrealisedPnl / costBasis) * 100).toFixed(2)) : 0,
    realisedPnl,
    change24,
    change24Percent:
      previousValue > 0
        ? Number(((change24 / previousValue) * 100).toFixed(2))
        : 0,
    holdingsCount: rows.length,
  };
}

/* ===================================================================== */
/*  3. PROFIT & LOSS  (ProfitLoss page)                                  */
/* ===================================================================== */

/**
 * Everything about closed trades.
 *
 * Only SELL fills matter here: a buy has not made or lost anything yet, it
 * has just changed money into coins. Profit becomes real when you sell.
 */
async function getPnl(userId, { days = 30 } = {}) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const sells = await Fill.find({
    user: userId,
    side: "sell",
    createdAt: { $gte: since },
  })
    .sort({ createdAt: 1 })
    .lean();

  const allFills = await Fill.find({
    user: userId,
    createdAt: { $gte: since },
  }).lean();

  const wins = sells.filter((f) => f.realisedPnl > 0);
  const losses = sells.filter((f) => f.realisedPnl < 0);

  const realised = roundQuote(sells.reduce((s, f) => s + f.realisedPnl, 0));
  const grossProfit = roundQuote(wins.reduce((s, f) => s + f.realisedPnl, 0));
  const grossLoss = roundQuote(
    Math.abs(losses.reduce((s, f) => s + f.realisedPnl, 0)),
  );

  // Fees are charged on buys as well as sells, so use every fill
  const totalFees = roundQuote(allFills.reduce((s, f) => s + f.fee, 0));

  // ---- group by day, oldest first, for the bar chart ------------------
  const byDayMap = new Map();

  for (const fill of sells) {
    const day = fill.createdAt.toISOString().slice(0, 10);
    const entry = byDayMap.get(day) || { date: day, pnl: 0, trades: 0, fees: 0 };
    entry.pnl = roundQuote(entry.pnl + fill.realisedPnl);
    entry.fees = roundQuote(entry.fees + fill.fee);
    entry.trades += 1;
    byDayMap.set(day, entry);
  }

  const byDay = [...byDayMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Unrealised comes from what is still held
  const summary = await getSummary(userId);

  return {
    quote: QUOTE_ASSET,
    days,
    realised,
    unrealised: summary.unrealisedPnl,
    total: roundQuote(realised + summary.unrealisedPnl),
    totalFees,
    trades: sells.length,
    wins: wins.length,
    losses: losses.length,
    winRate:
      sells.length > 0
        ? Number(((wins.length / sells.length) * 100).toFixed(1))
        : 0,
    grossProfit,
    grossLoss,
    // How much profit you make for every unit of loss. Above 1 is healthy.
    profitFactor:
      grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : null,
    averageWin: wins.length ? roundQuote(grossProfit / wins.length) : 0,
    averageLoss: losses.length ? roundQuote(grossLoss / losses.length) : 0,
    byDay,
    trades_list: sells.map((f) => ({
      id: String(f._id),
      asset: f.asset,
      key: getAsset(f.asset)?.key || f.asset.toLowerCase(),
      pair: f.pair,
      qty: f.qty,
      price: f.price,
      value: f.value,
      fees: f.fee,
      net: f.realisedPnl,
      win: f.realisedPnl > 0,
      date: f.createdAt,
    })),
  };
}

/* ===================================================================== */
/*  4. PERFORMANCE  (PerformanceReport page)                             */
/* ===================================================================== */

/**
 * Builds an equity curve day by day.
 *
 * HOW: start from zero, then walk through the ledger in order. Deposits add
 * to the account, withdrawals take away, and realised profit or loss moves it
 * up or down. The last point also includes what today's holdings are worth.
 *
 * LIMITATION worth knowing: this is a REALISED equity curve. It does not go
 * back and re-price yesterday's holdings at yesterday's market price, because
 * we do not store daily snapshots. So the curve shows money in, money out and
 * profit taken — not day-to-day market swings on coins still held.
 */
async function getPerformance(userId, { days = 90 } = {}) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const entries = await LedgerEntry.find({
    user: userId,
    type: { $in: ["deposit", "withdrawal"] },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: 1 })
    .lean();

  const sells = await Fill.find({
    user: userId,
    side: "sell",
    createdAt: { $gte: since },
  })
    .sort({ createdAt: 1 })
    .lean();

  // Collect every day's movement into one map
  const dayMap = new Map();
  const touch = (date) => {
    const day = date.toISOString().slice(0, 10);
    if (!dayMap.has(day)) {
      dayMap.set(day, { date: day, flow: 0, pnl: 0 });
    }
    return dayMap.get(day);
  };

  for (const entry of entries) {
    const bucket = touch(entry.createdAt);
    const amount = Number(entry.meta?.quoteValue ?? entry.availableDelta);
    bucket.flow = roundQuote(bucket.flow + amount);
  }

  for (const fill of sells) {
    const bucket = touch(fill.createdAt);
    bucket.pnl = roundQuote(bucket.pnl + fill.realisedPnl);
  }

  const sortedDays = [...dayMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // ---- walk forward, building the curve -------------------------------
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const curve = [];
  const dailyReturns = [];

  for (const day of sortedDays) {
    const before = equity;
    equity = roundQuote(equity + day.flow + day.pnl);

    // Drawdown = how far below the highest point we have fallen
    if (equity > peak) peak = equity;
    if (peak > 0) {
      const drawdown = ((peak - equity) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Return for the day ignores deposits/withdrawals — putting money in is
    // not a gain, and counting it as one would flatter the numbers.
    if (before > 0) dailyReturns.push((day.pnl / before) * 100);

    curve.push({
      date: day.date,
      equity,
      pnl: day.pnl,
      flow: day.flow,
    });
  }

  const summary = await getSummary(userId);

  const best = sortedDays.reduce(
    (b, d) => (b === null || d.pnl > b.pnl ? d : b),
    null,
  );
  const worst = sortedDays.reduce(
    (w, d) => (w === null || d.pnl < w.pnl ? d : w),
    null,
  );

  return {
    quote: QUOTE_ASSET,
    days,
    curve,
    currentEquity: summary.netWorth,
    totalRealised: roundQuote(sortedDays.reduce((s, d) => s + d.pnl, 0)),
    totalDeposited: roundQuote(
      sortedDays.reduce((s, d) => s + (d.flow > 0 ? d.flow : 0), 0),
    ),
    totalWithdrawn: roundQuote(
      Math.abs(sortedDays.reduce((s, d) => s + (d.flow < 0 ? d.flow : 0), 0)),
    ),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    bestDay: best ? { date: best.date, pnl: best.pnl } : null,
    worstDay: worst ? { date: worst.date, pnl: worst.pnl } : null,
    sharpe: sharpeRatio(dailyReturns),
    tradingDays: sortedDays.length,
    // Told plainly so nobody reads more into the chart than it can support
    note:
      "Equity is built from deposits, withdrawals and realised profit. " +
      "Holdings are not re-priced at historical market rates.",
  };
}

/**
 * Sharpe ratio: how much return you got for the amount of ups and downs.
 * Higher is better. Roughly: average return / how much it bounced around.
 */
function sharpeRatio(returns) {
  if (returns.length < 2) return null;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;

  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  // x sqrt(365) turns a daily figure into a yearly one
  return Number(((mean / stdDev) * Math.sqrt(365)).toFixed(2));
}

module.exports = { getHoldings, getSummary, getPnl, getPerformance };
