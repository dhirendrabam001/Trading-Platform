/**
 * Trade flow test.
 *
 * Places real orders through orderService against live prices, then checks
 * that the money adds up. Uses a throwaway user id and deletes everything it
 * wrote at the end.
 *
 *   node scripts/tradeFlow.test.js
 */
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const priceService = require("../services/priceService");
const orderService = require("../services/orderService");
const ledgerService = require("../services/ledgerService");
const engine = require("../services/executionEngine");
const { Order } = require("../models/order.model");
const { Fill } = require("../models/fill.model");
const { Balance } = require("../models/balance.model");
const { LedgerEntry } = require("../models/ledgerEntry.model");
const { FEES } = require("../config/trading");

const USER = new mongoose.Types.ObjectId("0000000000000000feedface");

let failures = 0;
const check = (label, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
};

const wipe = async () => {
  await Promise.all([
    LedgerEntry.collection.deleteMany({ user: USER }),
    Balance.deleteMany({ user: USER }),
    Order.deleteMany({ user: USER }),
    Fill.deleteMany({ user: USER }),
  ]);
};

const usdt = async () => (await ledgerService.getBalance(USER, "USDT")).available;
const btc = async () => await ledgerService.getBalance(USER, "BTC");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await wipe();

  await priceService.start();
  await new Promise((r) => setTimeout(r, 3500));

  const price = priceService.getPrice("BTC");
  console.log(`  live BTC price: ${price}\n`);

  // fund the account
  await ledgerService.post(USER, [
    { asset: "USDT", type: "deposit", availableDelta: 100000 },
  ]);

  /* ------------------------------------------------ 1. market buy ----- */
  console.log("=== 1. market buy ===");
  const startUsdt = await usdt();

  const buy = await orderService.placeOrder(USER, {
    asset: "BTC",
    side: "buy",
    type: "market",
    amount: 0.5,
  });

  check("order is filled immediately", buy.status === "filled", buy.status);

  const afterBuyUsdt = await usdt();
  const afterBuyBtc = await btc();
  const spent = Number((startUsdt - afterBuyUsdt).toFixed(2));
  const expectedSpend = Number(
    (0.5 * buy.avgFillPrice * (1 + FEES.taker)).toFixed(2),
  );

  check("received exactly 0.5 BTC", afterBuyBtc.available === 0.5, String(afterBuyBtc.available));
  check(
    "USDT spent = value + taker fee",
    Math.abs(spent - expectedSpend) < 0.05,
    `spent ${spent} vs expected ${expectedSpend}`,
  );
  check("nothing left locked", afterBuyBtc.locked === 0 &&
    (await ledgerService.getBalance(USER, "USDT")).locked === 0);
  check("cost basis recorded", afterBuyBtc.totalCost > 0,
    `avgCost ${afterBuyBtc.avgCost}, totalCost ${afterBuyBtc.totalCost}`);

  /* ------------------------------------------------ 2. market sell ---- */
  console.log("\n=== 2. market sell (realises P&L) ===");
  const sell = await orderService.placeOrder(USER, {
    asset: "BTC",
    side: "sell",
    type: "market",
    amount: 0.25,
  });

  check("sell filled", sell.status === "filled", sell.status);

  const afterSellBtc = await btc();
  check("0.25 BTC left", afterSellBtc.available === 0.25, String(afterSellBtc.available));

  const sellFill = await Fill.findOne({ user: USER, side: "sell" }).lean();
  const expectedPnl = Number(
    (sellFill.value - sellFill.fee - afterBuyBtc.avgCost * 0.25).toFixed(2),
  );
  check(
    "realised P&L = proceeds - fee - cost of those coins",
    Math.abs(sellFill.realisedPnl - expectedPnl) < 0.05,
    `got ${sellFill.realisedPnl}, expected ${expectedPnl}`,
  );
  check("cost basis reduced by what we sold", afterSellBtc.totalCost < afterBuyBtc.totalCost,
    `${afterBuyBtc.totalCost} -> ${afterSellBtc.totalCost}`);

  /* ------------------------------------------------ 3. limit order ---- */
  console.log("\n=== 3. limit sell above market stays open ===");
  const highPrice = Number((price * 1.5).toFixed(2));
  const limit = await orderService.placeOrder(USER, {
    asset: "BTC",
    side: "sell",
    type: "limit",
    amount: 0.1,
    price: highPrice,
  });

  check("stays open", limit.status === "open", limit.status);
  const lockedCoin = (await btc()).locked;
  check("coins are locked, not sold", lockedCoin === 0.1, `${lockedCoin} BTC locked`);

  console.log("\n=== 4. engine fills it once the price is reached ===");
  // Lower the ask under the market so the engine sees it as fillable. A sell
  // locks the COIN, so changing the price cannot desync the lock.
  const order = await Order.findById(limit.id);
  order.price = Number((price * 0.5).toFixed(2));
  await order.save();

  await engine.checkOrder(await Order.findById(limit.id));
  const filled = await Order.findById(limit.id);
  check("engine filled it", filled.status === "filled", filled.status);
  check(
    "filled at the better price (market, not the low ask)",
    filled.avgFillPrice > order.price,
    `ask ${order.price}, got ${filled.avgFillPrice}`,
  );

  // run again — must NOT double fill
  await engine.checkOrder(await Order.findById(limit.id));
  const fillCount = await Fill.countDocuments({ order: limit.id });
  check("filled exactly once, not twice", fillCount === 1, `${fillCount} fills`);

  const lowPrice = Number((price * 0.5).toFixed(2));

  /* ------------------------------------------------ 5. cancel --------- */
  console.log("\n=== 5. cancelling returns the locked money ===");
  const beforeCancel = await usdt();
  const toCancel = await orderService.placeOrder(USER, {
    asset: "BTC",
    side: "buy",
    type: "limit",
    amount: 0.1,
    price: lowPrice,
  });
  const whileOpen = await usdt();
  check("money left available while open", whileOpen < beforeCancel);

  await orderService.cancelOrder(USER, toCancel.id);
  const afterCancel = await usdt();
  check("full amount returned", Math.abs(afterCancel - beforeCancel) < 0.01,
    `${beforeCancel} -> ${afterCancel}`);
  check("no USDT stuck as locked",
    (await ledgerService.getBalance(USER, "USDT")).locked === 0);

  /* ------------------------------------------------ 6. rejections ----- */
  console.log("\n=== 6. bad orders are refused ===");
  const tryFail = async (label, input) => {
    try {
      await orderService.placeOrder(USER, input);
      check(label, false, "it was ACCEPTED");
    } catch {
      check(label, true);
    }
  };
  await tryFail("buy more than you can afford",
    { asset: "BTC", side: "buy", type: "market", amount: 9999 });
  await tryFail("sell coins you do not have",
    { asset: "BTC", side: "sell", type: "market", amount: 9999 });
  await tryFail("limit order with no price",
    { asset: "BTC", side: "buy", type: "limit", amount: 0.1 });
  await tryFail("order below minimum size",
    { asset: "BTC", side: "buy", type: "market", amount: 0.00000001 });

  const orphans = await Order.countDocuments({ user: USER, status: "open" });
  check("no half-created orders left behind", orphans === 0, `${orphans} open`);

  /* ------------------------------------------------ 7. reconcile ------ */
  console.log("\n=== 7. the books still balance ===");
  const rec = await ledgerService.reconcile(USER);
  check("sum(ledger) === balances after all trading", rec.ok,
    rec.ok ? `(${rec.assets} assets)` : JSON.stringify(rec.drift));

  const bals = await Balance.find({ user: USER }).lean();
  check("no negative balances", bals.every((b) => b.available >= 0 && b.locked >= 0));
  check("nothing stuck locked at the end", bals.every((b) => b.locked === 0),
    bals.filter((b) => b.locked > 0).map((b) => `${b.asset}:${b.locked}`).join(" ") || "");

  await wipe();
  priceService.stop();
  await mongoose.disconnect();
  console.log(failures ? `\n${failures} FAILURES` : "\ntrade flow is correct");
  process.exit(failures ? 1 : 0);
})().catch(async (e) => {
  console.error("\nTEST ERROR:", e.message, "\n", e.stack?.split("\n")[1] || "");
  try { await wipe(); priceService.stop(); await mongoose.disconnect(); } catch {}
  process.exit(1);
});
