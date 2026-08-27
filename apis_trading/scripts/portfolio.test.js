/**
 * Portfolio analytics test.
 *
 * Builds a real trading history, then checks every number the Portfolio,
 * Profit & Loss and Performance pages rely on. Cleans up after itself.
 *
 *   node scripts/portfolio.test.js
 */
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const priceService = require("../services/priceService");
const orderService = require("../services/orderService");
const ledgerService = require("../services/ledgerService");
const portfolioService = require("../services/portfolioService");
const { Order } = require("../models/order.model");
const { Fill } = require("../models/fill.model");
const { Balance } = require("../models/balance.model");
const { LedgerEntry } = require("../models/ledgerEntry.model");

const USER = new mongoose.Types.ObjectId("0000000000000000cafebabe");

let failures = 0;
const check = (label, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
};
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;

const wipe = () =>
  Promise.all([
    LedgerEntry.collection.deleteMany({ user: USER }),
    Balance.deleteMany({ user: USER }),
    Order.deleteMany({ user: USER }),
    Fill.deleteMany({ user: USER }),
  ]);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await wipe();
  await priceService.start();
  await new Promise((r) => setTimeout(r, 3500));

  // ---- build a history -------------------------------------------------
  await ledgerService.post(USER, [
    { asset: "USDT", type: "deposit", availableDelta: 100000, meta: { quoteValue: 100000 } },
  ]);

  const buy = (asset, amount) =>
    orderService.placeOrder(USER, { asset, side: "buy", type: "market", amount });
  const sell = (asset, amount) =>
    orderService.placeOrder(USER, { asset, side: "sell", type: "market", amount });

  await buy("BTC", 0.4);
  await buy("ETH", 6);
  await buy("SOL", 50);
  await sell("ETH", 2); // realise something
  await sell("SOL", 20);

  console.log("  history: 3 buys, 2 sells\n");

  /* ============================ HOLDINGS ============================= */
  console.log("=== holdings (Portfolio page) ===");
  const { rows, cash, invested } = await portfolioService.getHoldings(USER);

  check("one row per coin held", rows.length === 3, `${rows.length} rows`);
  check("USDT is cash, not a holding", !rows.some((r) => r.symbol === "USDT"));

  const allocationTotal = Number(
    rows.reduce((s, r) => s + r.allocation, 0).toFixed(2),
  );
  check(
    "allocation sums to EXACTLY 100%",
    allocationTotal === 100,
    `${allocationTotal}%`,
  );

  const investedFromRows = Number(
    rows.reduce((s, r) => s + r.value, 0).toFixed(2),
  );
  check("invested = sum of row values", near(invested, investedFromRows),
    `${invested} vs ${investedFromRows}`);

  const sortedDesc = rows.every(
    (r, i) => i === 0 || rows[i - 1].value >= r.value,
  );
  check("rows sorted biggest first", sortedDesc);

  for (const r of rows) {
    check(
      `  ${r.symbol}: pnl = value - cost`,
      near(r.pnl, Number((r.value - r.cost).toFixed(2))),
      `${r.pnl} vs ${(r.value - r.cost).toFixed(2)}`,
    );
  }

  /* ============================ SUMMARY ============================== */
  console.log("\n=== summary (Dashboard) ===");
  const summary = await portfolioService.getSummary(USER);

  check("netWorth = invested + cash",
    near(summary.netWorth, Number((summary.invested + summary.cash).toFixed(2))),
    `${summary.netWorth} = ${summary.invested} + ${summary.cash}`);
  check("unrealised = invested - costBasis",
    near(summary.unrealisedPnl,
      Number((summary.invested - summary.costBasis).toFixed(2))));
  check("cash matches the USDT balance",
    near(summary.cash, (await ledgerService.getBalance(USER, "USDT")).available));
  check("holdingsCount matches rows", summary.holdingsCount === rows.length);

  /* ============================== P&L ================================ */
  console.log("\n=== profit & loss ===");
  const pnl = await portfolioService.getPnl(USER, { days: 30 });

  const sells = await Fill.find({ user: USER, side: "sell" }).lean();
  const allFills = await Fill.find({ user: USER }).lean();
  const expectedRealised = Number(
    sells.reduce((s, f) => s + f.realisedPnl, 0).toFixed(2),
  );
  const expectedFees = Number(allFills.reduce((s, f) => s + f.fee, 0).toFixed(2));

  check("realised = sum of sell fills", near(pnl.realised, expectedRealised),
    `${pnl.realised} vs ${expectedRealised}`);
  check("trade count = number of sells", pnl.trades === sells.length,
    `${pnl.trades} vs ${sells.length}`);
  check("wins + losses <= trades", pnl.wins + pnl.losses <= pnl.trades);
  check("fees counted from ALL fills, not just sells",
    near(pnl.totalFees, expectedFees), `${pnl.totalFees} vs ${expectedFees}`);
  check("grossProfit - grossLoss = realised",
    near(Number((pnl.grossProfit - pnl.grossLoss).toFixed(2)), pnl.realised),
    `${pnl.grossProfit} - ${pnl.grossLoss} vs ${pnl.realised}`);
  check("total = realised + unrealised",
    near(pnl.total, Number((pnl.realised + pnl.unrealised).toFixed(2))));

  const byDaySum = Number(pnl.byDay.reduce((s, d) => s + d.pnl, 0).toFixed(2));
  check("daily buckets sum to realised total", near(byDaySum, pnl.realised),
    `${byDaySum} vs ${pnl.realised}`);
  const daysOrdered = pnl.byDay.every(
    (d, i) => i === 0 || pnl.byDay[i - 1].date <= d.date,
  );
  check("daily buckets are oldest first", daysOrdered);

  /* ========================== PERFORMANCE ============================ */
  console.log("\n=== performance ===");
  const perf = await portfolioService.getPerformance(USER, { days: 90 });

  check("equity curve has points", perf.curve.length > 0, `${perf.curve.length} days`);
  check("deposits recorded", perf.totalDeposited >= 100000,
    String(perf.totalDeposited));
  check("maxDrawdown is a percentage 0-100",
    perf.maxDrawdown >= 0 && perf.maxDrawdown <= 100, String(perf.maxDrawdown));
  check("curve is chronological",
    perf.curve.every((c, i) => i === 0 || perf.curve[i - 1].date <= c.date));
  check("realised in performance matches P&L",
    near(perf.totalRealised, pnl.realised),
    `${perf.totalRealised} vs ${pnl.realised}`);
  check("limitation is stated, not hidden", Boolean(perf.note));

  /* ======================= EMPTY ACCOUNT ============================= */
  console.log("\n=== a brand new account does not crash ===");
  const FRESH = new mongoose.Types.ObjectId("0000000000000000000000ff");
  const empty = await portfolioService.getHoldings(FRESH);
  const emptySummary = await portfolioService.getSummary(FRESH);
  const emptyPnl = await portfolioService.getPnl(FRESH, { days: 30 });
  const emptyPerf = await portfolioService.getPerformance(FRESH, { days: 90 });

  check("no holdings", empty.rows.length === 0);
  check("netWorth is 0 not NaN", emptySummary.netWorth === 0);
  check("winRate is 0 not NaN", emptyPnl.winRate === 0);
  check("profitFactor is null, not Infinity", emptyPnl.profitFactor === null);
  check("sharpe is null, not NaN", emptyPerf.sharpe === null);
  check("no divide-by-zero anywhere",
    ![emptySummary.unrealisedPercent, emptySummary.change24Percent,
      emptyPnl.winRate].some((v) => Number.isNaN(v)));

  /* ============================ BOOKS =============================== */
  console.log("\n=== books still balance after all of it ===");
  const rec = await ledgerService.reconcile(USER);
  check("sum(ledger) === balances", rec.ok,
    rec.ok ? `(${rec.assets} assets)` : JSON.stringify(rec.drift));

  await wipe();
  priceService.stop();
  await mongoose.disconnect();
  console.log(failures ? `\n${failures} FAILURES` : "\nportfolio analytics are correct");
  process.exit(failures ? 1 : 0);
})().catch(async (e) => {
  console.error("\nTEST ERROR:", e.message, "\n", e.stack?.split("\n")[1] || "");
  try { await wipe(); priceService.stop(); await mongoose.disconnect(); } catch {}
  process.exit(1);
});
