const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const ledgerService = require("../services/ledgerService");
const priceService = require("../services/priceService");
const { LedgerEntry } = require("../models/ledgerEntry.model");
const { getAsset, roundQty, roundQuote, QUOTE_ASSET, ASSETS } = require("../config/assets");
const { DEMO_GRANT, DEPOSIT, WITHDRAWAL } = require("../config/trading");
const notificationService = require("../services/notificationService");

/**
 * Grants the paper-trading starting balance the first time an account is
 * used. Idempotent by construction: it only fires when the user has no
 * ledger history at all, so it can never run twice for the same account.
 */
const grantDemoFundsIfNew = async (userId) => {
  const existing = await LedgerEntry.countDocuments({ user: userId }).limit(1);
  if (existing > 0) return false;

  await ledgerService.post(userId, [
    {
      asset: DEMO_GRANT.asset,
      type: "deposit",
      availableDelta: DEMO_GRANT.amount,
      refType: "manual",
      refId: DEMO_GRANT.refId,
      meta: { note: "Demo trading funds", network: "Demo" },
    },
  ]);

  return true;
};

/** GET /api/wallet/balances */
const getBalances = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const granted = await grantDemoFundsIfNew(userId);
  const balances = await ledgerService.getBalances(userId);
  const byAsset = new Map(balances.map((b) => [b.asset, b]));

  // Every catalogue asset is returned, held or not, so the Wallet page can
  // show a complete list rather than only what the user happens to own.
  const rows = ASSETS.map((asset) => {
    const held = byAsset.get(asset.symbol);
    const available = held ? held.available : 0;
    const locked = held ? held.locked : 0;
    const total = roundQty(asset.symbol, available + locked);
    const price = priceService.getPrice(asset.symbol);

    return {
      symbol: asset.symbol,
      key: asset.key,
      name: asset.name,
      available,
      locked,
      total,
      price,
      // null price means "cannot value this right now" — the UI must show a
      // dash rather than treating the holding as worthless.
      value: price === null ? null : roundQuote(total * price),
      avgCost: held ? held.avgCost : 0,
      totalCost: held ? held.totalCost : 0,
      realisedPnl: held ? held.realisedPnl : 0,
    };
  });

  const priced = rows.filter((r) => r.value !== null);

  res.json({
    success: true,
    quote: QUOTE_ASSET,
    granted,
    totals: {
      value: roundQuote(priced.reduce((s, r) => s + r.value, 0)),
      free: roundQuote(
        priced.reduce((s, r) => s + r.available * r.price, 0),
      ),
      locked: roundQuote(priced.reduce((s, r) => s + r.locked * r.price, 0)),
      unpriced: rows.length - priced.length,
    },
    balances: rows,
  });
});

/**
 * Sum of a user's withdrawals since UTC midnight, valued in the quote asset.
 * Computed from the ledger rather than stored, so it cannot drift.
 */
const withdrawnToday = async (userId) => {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const entries = await LedgerEntry.find({
    user: userId,
    type: "withdrawal",
    createdAt: { $gte: since },
  }).lean();

  return entries.reduce((sum, e) => sum + Number(e.meta?.quoteValue || 0), 0);
};

/** GET /api/wallet/limits */
const getLimits = asyncHandler(async (req, res) => {
  const used = await withdrawnToday(req.user.id);

  res.json({
    success: true,
    quote: QUOTE_ASSET,
    deposit: DEPOSIT,
    withdrawal: {
      ...WITHDRAWAL,
      usedToday: roundQuote(used),
      remainingToday: roundQuote(Math.max(0, WITHDRAWAL.dailyLimitQuote - used)),
    },
  });
});

/** POST /api/wallet/deposit — simulated funding for paper trading */
const deposit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { asset, amount, network } = req.body;

  const meta = getAsset(asset);
  if (!meta) throw ApiError.badRequest(`Unknown asset ${asset}`);

  const price = priceService.getPrice(meta.symbol);
  if (price === null) {
    throw new ApiError(503, `No price available for ${meta.symbol} right now`);
  }

  const quoteValue = roundQuote(amount * price);
  if (quoteValue < DEPOSIT.minQuote) {
    throw ApiError.badRequest(
      `Minimum deposit is ${DEPOSIT.minQuote} ${QUOTE_ASSET}`,
    );
  }
  if (quoteValue > DEPOSIT.maxQuote) {
    throw ApiError.badRequest(
      `Maximum deposit is ${DEPOSIT.maxQuote} ${QUOTE_ASSET}`,
    );
  }

  const [entry] = await ledgerService.post(userId, [
    {
      asset: meta.symbol,
      type: "deposit",
      availableDelta: roundQty(meta.symbol, amount),
      refType: "transfer",
      meta: { network: network || "Demo", quoteValue, price },
    },
  ]);

  notificationService.depositCredited(userId, meta.symbol, amount, network);

  res.status(201).json({
    success: true,
    message: "Deposit credited",
    entry,
    balance: await ledgerService.getBalance(userId, meta.symbol),
  });
});

/** POST /api/wallet/withdraw — simulated, but with real server-side limits */
const withdraw = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { asset, amount, address } = req.body;

  const meta = getAsset(asset);
  if (!meta) throw ApiError.badRequest(`Unknown asset ${asset}`);

  const price = priceService.getPrice(meta.symbol);
  if (price === null) {
    throw new ApiError(503, `No price available for ${meta.symbol} right now`);
  }

  const qty = roundQty(meta.symbol, amount);
  const quoteValue = roundQuote(qty * price);

  if (quoteValue < WITHDRAWAL.minQuote) {
    throw ApiError.badRequest(
      `Minimum withdrawal is ${WITHDRAWAL.minQuote} ${QUOTE_ASSET}`,
    );
  }

  // Balance is checked BEFORE the daily limit so the error names the real
  // problem. Asking to withdraw 9999 BTC from a 0.5 BTC balance should say
  // "insufficient funds", not "daily limit reached" — both are true, but
  // only one tells the user what to do. ledgerService.post still enforces
  // this independently, so the check below is for the message, not safety.
  const held = await ledgerService.getBalance(userId, meta.symbol);
  if (held.available < qty) {
    throw ApiError.badRequest(
      `Insufficient ${meta.symbol}: you have ${held.available} available`,
    );
  }

  // Recomputed from the ledger rather than trusted from the client — the
  // page's DAILY_LIMIT constant is only a display hint.
  const used = await withdrawnToday(userId);
  if (used + quoteValue > WITHDRAWAL.dailyLimitQuote) {
    throw ApiError.badRequest(
      `Daily withdrawal limit reached. ${roundQuote(
        Math.max(0, WITHDRAWAL.dailyLimitQuote - used),
      )} ${QUOTE_ASSET} remaining today.`,
    );
  }

  // A negative resulting balance is rejected inside ledgerService.post, so
  // there is no separate "do they have enough?" check to fall out of sync.
  const [entry] = await ledgerService.post(userId, [
    {
      asset: meta.symbol,
      type: "withdrawal",
      availableDelta: -qty,
      refType: "transfer",
      meta: { address: address || null, quoteValue, price },
    },
  ]);

  notificationService.withdrawalSent(userId, meta.symbol, qty, address);

  res.status(201).json({
    success: true,
    message: "Withdrawal processed",
    entry,
    balance: await ledgerService.getBalance(userId, meta.symbol),
  });
});

/** GET /api/wallet/ledger — powers the Transactions page */
const getLedger = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type, asset, page, limit, includeInternal } = req.query;

  const filter = { user: userId };

  // lock/unlock are internal plumbing for open orders, not something a user
  // thinks of as a transaction. Hidden unless explicitly asked for.
  if (!includeInternal) filter.type = { $nin: ["lock", "unlock"] };
  if (type) filter.type = type;
  if (asset) filter.asset = getAsset(asset)?.symbol || asset;

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    LedgerEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LedgerEntry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    entries,
  });
});

/** GET /api/wallet/reconcile — proves cached balances match the ledger */
const reconcile = asyncHandler(async (req, res) => {
  const result = await ledgerService.reconcile(req.user.id);
  res.json({ success: true, ...result });
});

module.exports = {
  getBalances,
  getLimits,
  deposit,
  withdraw,
  getLedger,
  reconcile,
};
