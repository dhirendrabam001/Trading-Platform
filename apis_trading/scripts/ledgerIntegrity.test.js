/**
 * Ledger integrity test.
 * Uses a throwaway user id and deletes everything it wrote at the end.
 */
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const ledgerService = require("../services/ledgerService");
const { Balance } = require("../models/balance.model");
const { LedgerEntry } = require("../models/ledgerEntry.model");
const { roundQty } = require("../config/assets");

const USER = new mongoose.Types.ObjectId("0000000000000000deadbeef");
let failures = 0;
const check = (label, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
};

// deterministic sequence — same run every time
const rng = (s) => () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    LedgerEntry.collection.deleteMany({ user: USER }),
    Balance.deleteMany({ user: USER }),
  ]);

  console.log("=== 1. randomised sequence, then reconcile ===");
  const next = rng(42);
  const assets = ["USDT", "BTC", "ETH", "SOL"];

  // fund first so debits are possible
  for (const a of assets) {
    await ledgerService.post(USER, [
      { asset: a, type: "deposit", availableDelta: a === "USDT" ? 50000 : 100 },
    ]);
  }

  let applied = 0, rejected = 0;
  for (let i = 0; i < 120; i++) {
    const asset = assets[Math.floor(next() * assets.length)];
    const roll = next();
    const qty = roundQty(asset, next() * 20 + 0.001);

    try {
      if (roll < 0.35) {
        await ledgerService.post(USER, [
          { asset, type: "deposit", availableDelta: qty },
        ]);
      } else if (roll < 0.6) {
        await ledgerService.post(USER, [
          { asset, type: "withdrawal", availableDelta: -qty },
        ]);
      } else if (roll < 0.8) {
        // lock: available -> locked, total unchanged
        await ledgerService.post(USER, [
          { asset, type: "lock", availableDelta: -qty, lockedDelta: qty },
        ]);
      } else {
        await ledgerService.post(USER, [
          { asset, type: "unlock", availableDelta: qty, lockedDelta: -qty },
        ]);
      }
      applied++;
    } catch {
      rejected++; // insufficient funds etc. — must leave NO trace
    }
  }
  console.log(`  ${applied} movements applied, ${rejected} rejected`);

  const rec = await ledgerService.reconcile(USER);
  check("sum(ledger) === cached balance for every asset", rec.ok,
    rec.ok ? `(${rec.assets} assets)` : JSON.stringify(rec.drift));

  console.log("\n=== 2. a rejected write leaves nothing behind ===");
  const beforeEntries = await LedgerEntry.countDocuments({ user: USER });
  const beforeBal = await Balance.findOne({ user: USER, asset: "BTC" }).lean();
  try {
    await ledgerService.post(USER, [
      { asset: "BTC", type: "withdrawal", availableDelta: -999999 },
    ]);
    check("over-withdrawal rejected", false, "it was ALLOWED");
  } catch {
    check("over-withdrawal rejected", true);
  }
  const afterEntries = await LedgerEntry.countDocuments({ user: USER });
  const afterBal = await Balance.findOne({ user: USER, asset: "BTC" }).lean();
  check("no ledger row written on rejection", beforeEntries === afterEntries,
    `${beforeEntries} -> ${afterEntries}`);
  check("balance unchanged on rejection", beforeBal.available === afterBal.available,
    `${beforeBal.available} -> ${afterBal.available}`);

  console.log("\n=== 3. multi-asset trade is all-or-nothing ===");
  const usdtBefore = (await Balance.findOne({ user: USER, asset: "USDT" }).lean()).available;
  const ethBefore = (await Balance.findOne({ user: USER, asset: "ETH" }).lean()).available;
  try {
    // credit ETH, then debit far more USDT than exists -> whole thing must roll back
    await ledgerService.post(USER, [
      { asset: "ETH", type: "trade_buy", availableDelta: 5 },
      { asset: "USDT", type: "trade_sell", availableDelta: -99999999 },
    ]);
    check("impossible leg aborts the whole post", false, "it was ALLOWED");
  } catch {
    check("impossible leg aborts the whole post", true);
  }
  const usdtAfter = (await Balance.findOne({ user: USER, asset: "USDT" }).lean()).available;
  const ethAfter = (await Balance.findOne({ user: USER, asset: "ETH" }).lean()).available;
  check("the successful leg was rolled back too", ethBefore === ethAfter,
    `ETH ${ethBefore} -> ${ethAfter}`);
  check("USDT untouched", usdtBefore === usdtAfter);

  console.log("\n=== 4. no balance can go negative ===");
  const all = await Balance.find({ user: USER }).lean();
  check("every available >= 0", all.every((b) => b.available >= 0));
  check("every locked >= 0", all.every((b) => b.locked >= 0));

  console.log("\n=== 5. ledger rows are immutable ===");
  const one = await LedgerEntry.findOne({ user: USER });
  let blocked = 0;
  try { await LedgerEntry.updateOne({ _id: one._id }, { $set: { availableDelta: 1 } }); }
  catch { blocked++; }
  try { one.availableDelta = 999; await one.save(); } catch { blocked++; }
  try { await LedgerEntry.deleteOne({ _id: one._id }); } catch { blocked++; }
  check("update / save / delete all blocked", blocked === 3, `${blocked}/3 blocked`);

  console.log("\n=== 6. reconcile DETECTS tampering ===");
  // write straight to the cache, bypassing the service
  await Balance.updateOne({ user: USER, asset: "BTC" }, { $inc: { available: 5 } });
  const tampered = await ledgerService.reconcile(USER);
  check("drift detected", !tampered.ok,
    tampered.ok ? "reconcile MISSED it" : `drift on ${tampered.drift.map(d=>d.asset).join(",")}`);

  const repaired = await ledgerService.reconcile(USER, { apply: true });
  const verify = await ledgerService.reconcile(USER);
  check("repair restores cache from ledger", verify.ok,
    `(repaired ${repaired.drift.length})`);

  // cleanup
  await Promise.all([
    LedgerEntry.collection.deleteMany({ user: USER }),
    Balance.deleteMany({ user: USER }),
  ]);
  const leftover = await LedgerEntry.countDocuments({ user: USER });
  console.log(`\n  cleanup: ${leftover} test rows remaining`);

  await mongoose.disconnect();
  console.log(failures ? `\n${failures} FAILURES` : "\nall ledger invariants hold");
  process.exit(failures ? 1 : 0);
})().catch(async (e) => {
  console.error("\nTEST ERROR:", e.message);
  try {
    await LedgerEntry.collection.deleteMany({ user: USER });
    await Balance.deleteMany({ user: USER });
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
