const mongoose = require("mongoose");
const { Balance } = require("../models/balance.model");
const { LedgerEntry } = require("../models/ledgerEntry.model");
const { ApiError } = require("../utils/ApiError");
const { getAsset, roundQty, roundQuote } = require("../config/assets");

/**
 * The only module permitted to write to Balance.
 *
 * Every caller goes through post(), which applies a set of movements and the
 * matching ledger rows inside one MongoDB transaction. Either all of it lands
 * or none of it does — a half-applied trade that debits USDT without
 * crediting BTC is the failure mode this exists to make impossible.
 */

/* ------------------------------------------------------------ transaction */

let transactionsSupported = null;

/**
 * Runs `fn` inside a transaction.
 *
 * Transactions need a replica set. Atlas provides one; a bare local mongod
 * does not. Rather than silently falling back to non-atomic writes — which
 * would quietly reintroduce exactly the corruption this service prevents —
 * an unsupported deployment fails loudly on first use.
 */
const withTransaction = async (fn) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    transactionsSupported = true;
    return result;
  } catch (error) {
    if (
      transactionsSupported === null &&
      /Transaction numbers are only allowed|replica set|not supported/i.test(
        error.message || "",
      )
    ) {
      transactionsSupported = false;
      throw new ApiError(
        500,
        "This MongoDB deployment does not support transactions. Ledger writes " +
          "require a replica set (MongoDB Atlas, or a local replica set).",
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

/* --------------------------------------------------------------- posting */

/**
 * One movement.
 * @typedef {Object} Movement
 * @property {string} asset            e.g. "USDT"
 * @property {string} type             ledger entry type
 * @property {number} [availableDelta] signed change to spendable balance
 * @property {number} [lockedDelta]    signed change to committed balance
 * @property {string} [refType]
 * @property {string} [refId]
 * @property {Object} [meta]
 */

/**
 * Applies movements atomically and returns the ledger entries written.
 *
 * Rules enforced here, not by callers:
 *   - unknown assets are rejected
 *   - neither available nor locked may end up negative
 *   - every balance change writes a matching ledger row
 *
 * @param {string|ObjectId} userId
 * @param {Movement[]} movements
 */
const post = async (userId, movements) => {
  if (!Array.isArray(movements) || movements.length === 0) {
    throw ApiError.badRequest("No movements to post");
  }

  for (const m of movements) {
    if (!getAsset(m.asset)) {
      throw ApiError.badRequest(`Unknown asset ${m.asset}`);
    }
  }

  return withTransaction(async (session) => {
    const entries = [];

    for (const move of movements) {
      const asset = getAsset(move.asset).symbol;
      const availableDelta = Number(move.availableDelta || 0);
      const lockedDelta = Number(move.lockedDelta || 0);

      if (availableDelta === 0 && lockedDelta === 0) continue;

      // upsert so a user's first ever movement in an asset creates the row
      let balance = await Balance.findOne({ user: userId, asset }).session(session);

      if (!balance) {
        [balance] = await Balance.create(
          [{ user: userId, asset, available: 0, locked: 0 }],
          { session },
        );
      }

      // Rounded to the asset's precision at every step so floating point
      // residue cannot accumulate into unspendable dust across many fills.
      const nextAvailable = roundQty(asset, balance.available + availableDelta);
      const nextLocked = roundQty(asset, balance.locked + lockedDelta);

      if (nextAvailable < 0) {
        throw ApiError.badRequest(
          `Insufficient ${asset}: need ${Math.abs(availableDelta)}, have ${balance.available}`,
        );
      }
      if (nextLocked < 0) {
        throw ApiError.badRequest(`Cannot unlock more ${asset} than is locked`);
      }

      balance.available = nextAvailable;
      balance.locked = nextLocked;

      // ---- cost basis -------------------------------------------------
      // Only trades send this. It answers "what did these coins cost me?",
      // which is what Portfolio and Profit & Loss are built on.
      //
      //   addCost    -> we bought, so we spent more money on this coin
      //   removeCost -> we sold, so part of what we spent is no longer held
      //   realised   -> the profit or loss that sale actually locked in
      if (move.costBasis) {
        const cb = move.costBasis;

        if (cb.addCost) {
          balance.totalCost = roundQuote(balance.totalCost + cb.addCost);
        }
        if (cb.removeCost) {
          // never let rounding push this below zero
          balance.totalCost = roundQuote(
            Math.max(0, balance.totalCost - cb.removeCost),
          );
        }
        if (cb.realised) {
          balance.realisedPnl = roundQuote(balance.realisedPnl + cb.realised);
        }

        // Average price per coin = total money spent / coins we still hold.
        // Selling does not change this number, only buying does.
        const unitsHeld = nextAvailable + nextLocked;
        balance.avgCost =
          unitsHeld > 0 ? roundQuote(balance.totalCost / unitsHeld) : 0;
      }

      await balance.save({ session });

      const [entry] = await LedgerEntry.create(
        [
          {
            user: userId,
            asset,
            type: move.type,
            availableDelta,
            lockedDelta,
            availableAfter: nextAvailable,
            lockedAfter: nextLocked,
            refType: move.refType || null,
            refId: move.refId || null,
            meta: move.meta || {},
          },
        ],
        { session },
      );

      entries.push(entry);
    }

    return entries;
  });
};

/* --------------------------------------------------------------- reading */

const getBalances = async (userId) => Balance.find({ user: userId }).lean();

const getBalance = async (userId, asset) => {
  const symbol = getAsset(asset)?.symbol;
  if (!symbol) throw ApiError.badRequest(`Unknown asset ${asset}`);

  const balance = await Balance.findOne({ user: userId, asset: symbol }).lean();
  return (
    balance || {
      user: userId,
      asset: symbol,
      available: 0,
      locked: 0,
      avgCost: 0,
      totalCost: 0,
      realisedPnl: 0,
    }
  );
};

/**
 * Recomputes a user's balances from the ledger and reports any drift.
 *
 * This is the integrity check for the whole money system: if the sum of a
 * user's ledger deltas does not equal their cached balance, something wrote
 * outside this service. `apply: true` repairs the cache from the ledger,
 * never the other way round.
 */
const reconcile = async (userId, { apply = false } = {}) => {
  const sums = await LedgerEntry.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: "$asset",
        available: { $sum: "$availableDelta" },
        locked: { $sum: "$lockedDelta" },
        entries: { $sum: 1 },
      },
    },
  ]);

  const balances = await Balance.find({ user: userId }).lean();
  const byAsset = new Map(balances.map((b) => [b.asset, b]));
  const drift = [];

  for (const row of sums) {
    const asset = row._id;
    const expectedAvailable = roundQty(asset, row.available);
    const expectedLocked = roundQty(asset, row.locked);
    const actual = byAsset.get(asset);

    const actualAvailable = actual ? actual.available : 0;
    const actualLocked = actual ? actual.locked : 0;

    if (
      expectedAvailable !== actualAvailable ||
      expectedLocked !== actualLocked
    ) {
      drift.push({
        asset,
        entries: row.entries,
        expected: { available: expectedAvailable, locked: expectedLocked },
        actual: { available: actualAvailable, locked: actualLocked },
      });

      if (apply) {
        await Balance.updateOne(
          { user: userId, asset },
          {
            $set: { available: expectedAvailable, locked: expectedLocked },
            $setOnInsert: { user: userId, asset },
          },
          { upsert: true },
        );
      }
    }

    byAsset.delete(asset);
  }

  // A balance row with no ledger history at all should not exist
  for (const orphan of byAsset.values()) {
    if (orphan.available !== 0 || orphan.locked !== 0) {
      drift.push({
        asset: orphan.asset,
        entries: 0,
        expected: { available: 0, locked: 0 },
        actual: { available: orphan.available, locked: orphan.locked },
        note: "balance with no ledger history",
      });
    }
  }

  return { ok: drift.length === 0, drift, assets: sums.length };
};

module.exports = { post, getBalance, getBalances, reconcile, withTransaction };
