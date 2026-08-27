const { Order } = require("../models/order.model");
const { Fill } = require("../models/fill.model");
const ledgerService = require("./ledgerService");
const priceService = require("./priceService");
const { ApiError } = require("../utils/ApiError");
const {
  getAsset,
  roundQty,
  roundQuote,
  pairLabel,
  QUOTE_ASSET,
} = require("../config/assets");
const { FEES, ORDER } = require("../config/trading");
const notificationService = require("./notificationService");
const realtimeService = require("./realtimeService");

/**
 * Everything about placing and filling orders.
 *
 * The one rule to remember:
 *
 *     An order LOCKS money. A fill MOVES money.
 *
 * Nothing here touches a balance directly — every change goes through
 * ledgerService.post(), which writes the ledger and the balance together in
 * one transaction. That is why the Wallet, Transactions, Orders and Trade
 * History pages can never disagree with each other.
 */

/* ===================================================================== */
/*  Small helpers                                                        */
/* ===================================================================== */

// Market orders take a price that is already there  -> taker fee
// Limit orders wait for the price to come to them   -> maker fee
function feeRateFor(orderType) {
  return orderType === "market" ? FEES.taker : FEES.maker;
}

function roleFor(orderType) {
  return orderType === "market" ? "taker" : "maker";
}

// Turns a database order into the shape the frontend pages already expect.
function toApi(order) {
  return {
    id: String(order._id),
    pair: order.pair,
    asset: order.asset,
    key: getAsset(order.asset)?.key || order.asset.toLowerCase(),
    side: order.side,
    type: order.type,
    price: order.price,
    triggerPrice: order.triggerPrice,
    amount: order.amount,
    filled: order.filled,
    remaining: roundQty(order.asset, order.amount - order.filled),
    avgFillPrice: order.avgFillPrice,
    feePaid: order.feePaid,
    status: order.status,
    createdAt: order.createdAt,
    closedAt: order.closedAt,
  };
}

/* ===================================================================== */
/*  1. PLACING AN ORDER                                                  */
/* ===================================================================== */

/**
 * Steps:
 *   1. check the inputs make sense
 *   2. work out how much money to hold
 *   3. hold it (this is the "lock")
 *   4. if it is a market order, fill it straight away
 *      otherwise leave it open for the execution engine to watch
 */
async function placeOrder(userId, input) {
  const { side, type } = input;

  // ---- step 1: validate ------------------------------------------------
  const asset = getAsset(input.asset);
  if (!asset) throw ApiError.badRequest(`Unknown asset ${input.asset}`);
  if (asset.isQuote) {
    throw ApiError.badRequest(`${asset.symbol} is the currency you trade with`);
  }

  const amount = roundQty(asset.symbol, input.amount);
  if (amount <= 0) throw ApiError.badRequest("Amount must be greater than zero");

  const marketPrice = priceService.getPrice(asset.symbol);
  if (marketPrice === null) {
    throw new ApiError(503, `No price for ${asset.symbol} right now, try again shortly`);
  }

  // Limit and stop orders need a price from the user. Market orders do not.
  let price = null;
  if (type === "limit" || type === "stop_limit") {
    price = Number(input.price);
    if (!price || price <= 0) {
      throw ApiError.badRequest("A limit order needs a price");
    }
  }

  let triggerPrice = null;
  if (type === "stop_limit") {
    triggerPrice = Number(input.triggerPrice);
    if (!triggerPrice || triggerPrice <= 0) {
      throw ApiError.badRequest("A stop order needs a trigger price");
    }
  }

  // Too many open orders is usually a bug or a script, not a person.
  const openCount = await Order.countDocuments({
    user: userId,
    status: { $in: ["open", "partial"] },
  });
  if (openCount >= ORDER.maxOpenOrders) {
    throw ApiError.badRequest(
      `You already have ${ORDER.maxOpenOrders} open orders. Cancel some first.`,
    );
  }

  // The price we use to size the order. For a market order that is the live
  // price; otherwise it is the price the user asked for.
  const workingPrice = price || marketPrice;

  const orderValue = roundQuote(amount * workingPrice);
  if (orderValue < ORDER.minNotionalQuote) {
    throw ApiError.badRequest(
      `Order is too small. Minimum is ${ORDER.minNotionalQuote} ${QUOTE_ASSET}.`,
    );
  }

  // ---- step 2: how much do we hold? ------------------------------------
  // Buying  -> hold USDT (the cost, plus the fee)
  // Selling -> hold the coin itself
  let lockedAsset;
  let lockedAmount;

  if (side === "buy") {
    const fee = roundQuote(orderValue * feeRateFor(type));
    lockedAsset = QUOTE_ASSET;
    lockedAmount = roundQuote(orderValue + fee);
  } else {
    lockedAsset = asset.symbol;
    lockedAmount = amount;
  }

  // ---- step 3: create the order, then lock the money -------------------
  const order = await Order.create({
    user: userId,
    asset: asset.symbol,
    pair: pairLabel(asset.symbol),
    side,
    type,
    amount,
    price,
    triggerPrice,
    lockedAsset,
    lockedAmount,
    status: "open",
  });

  try {
    // Moves money from "available" to "locked". The total does not change —
    // the user still owns it, they just cannot spend it twice.
    await ledgerService.post(userId, [
      {
        asset: lockedAsset,
        type: "lock",
        availableDelta: -lockedAmount,
        lockedDelta: lockedAmount,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, side, orderType: type },
      },
    ]);
  } catch (error) {
    // Not enough money. The order must not survive — otherwise the user
    // would see an open order that was never actually funded.
    await Order.deleteOne({ _id: order._id });
    throw error;
  }

  // ---- step 4: market orders fill immediately --------------------------
  if (type === "market") {
    await executeFill(order, marketPrice, "taker");
    const updated = await Order.findById(order._id);
    return toApi(updated);
  }

  // A limit order that is already better than the market should not sit
  // there waiting — fill it now, the same way a real exchange would.
  if (type === "limit" && limitIsFillable(side, price, marketPrice)) {
    await executeFill(order, price, "maker");
    const updated = await Order.findById(order._id);
    return toApi(updated);
  }

  return toApi(order);
}

/**
 * Can this limit order fill at the current market price?
 *
 *   buy  -> only if the market is at or BELOW my price (I get it cheap)
 *   sell -> only if the market is at or ABOVE my price (I get more)
 */
function limitIsFillable(side, limitPrice, marketPrice) {
  if (side === "buy") return marketPrice <= limitPrice;
  return marketPrice >= limitPrice;
}

/* ===================================================================== */
/*  2. FILLING AN ORDER                                                  */
/* ===================================================================== */

/**
 * Moves the money for an order and records a Fill.
 *
 * We fill the whole remaining amount in one go. A real exchange might fill in
 * pieces, but for paper trading against a live price this is both realistic
 * enough and far easier to follow.
 */
async function executeFill(order, fillPrice, role) {
  const qty = roundQty(order.asset, order.amount - order.filled);
  if (qty <= 0) return null;

  const value = roundQuote(qty * fillPrice);
  const fee = roundQuote(value * FEES[role]);

  let movements;
  let realisedPnl = 0;

  if (order.side === "buy") {
    // We held (value + fee) in USDT. Now we spend it and receive the coin.
    movements = [
      {
        asset: QUOTE_ASSET,
        type: "trade_buy",
        lockedDelta: -value,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, price: fillPrice, qty },
      },
      {
        asset: QUOTE_ASSET,
        type: "fee",
        lockedDelta: -fee,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, role, rate: FEES[role] },
      },
      {
        asset: order.asset,
        type: "trade_buy",
        availableDelta: qty,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, price: fillPrice },
        // What these coins cost us, fee included
        costBasis: { addCost: roundQuote(value + fee) },
      },
    ];
  } else {
    // Selling. Work out profit or loss against what the coins cost us.
    const balance = await ledgerService.getBalance(order.user, order.asset);
    const costOfSold = roundQuote(balance.avgCost * qty);
    realisedPnl = roundQuote(value - fee - costOfSold);

    movements = [
      {
        asset: order.asset,
        type: "trade_sell",
        lockedDelta: -qty,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, price: fillPrice, qty },
        costBasis: { removeCost: costOfSold, realised: realisedPnl },
      },
      {
        asset: QUOTE_ASSET,
        type: "trade_sell",
        availableDelta: value,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, price: fillPrice },
      },
      {
        asset: QUOTE_ASSET,
        type: "fee",
        availableDelta: -fee,
        refType: "order",
        refId: String(order._id),
        meta: { pair: order.pair, role, rate: FEES[role] },
      },
    ];
  }

  // One transaction: either all of this happens, or none of it does.
  await ledgerService.post(order.user, movements);

  const fill = await Fill.create({
    user: order.user,
    order: order._id,
    asset: order.asset,
    pair: order.pair,
    side: order.side,
    role,
    price: fillPrice,
    qty,
    value,
    fee,
    feeAsset: QUOTE_ASSET,
    realisedPnl,
  });

  // ---- update the order itself ----------------------------------------
  const filledBefore = order.filled;
  const filledNow = roundQty(order.asset, filledBefore + qty);

  // Weighted average of every price we filled at
  order.avgFillPrice =
    filledNow > 0
      ? roundQuote((order.avgFillPrice * filledBefore + fillPrice * qty) / filledNow)
      : fillPrice;

  order.filled = filledNow;
  order.feePaid = roundQuote(order.feePaid + fee);
  order.status = filledNow >= order.amount ? "filled" : "partial";
  if (order.status === "filled") order.closedAt = new Date();

  // A buy holds (value + fee) but the fee is charged on the price we ACTUALLY
  // filled at, which may be lower than the price we sized the lock on. Give
  // back anything left over instead of leaving it stuck as "locked forever".
  if (order.status === "filled") {
    await releaseLeftoverLock(order);
  }

  await order.save();

  // Told after the order is saved, and never allowed to throw — the trade
  // already happened, so a failed notification must not undo it.
  notificationService.orderFilled(order, fill);

  // Push straight to any tab this user has open, so the Orders and Wallet
  // pages update without waiting for their next poll.
  realtimeService.orderFilled(order.user, { order: toApi(order), fill });

  return fill;
}

/**
 * After a fill, any money still held for this order is no longer needed.
 * Give it back to the user's spendable balance.
 */
async function releaseLeftoverLock(order) {
  const balance = await ledgerService.getBalance(order.user, order.lockedAsset);
  if (balance.locked <= 0) return;

  // Only release what THIS order could still be holding.
  const leftover = roundQty(
    order.lockedAsset,
    Math.min(balance.locked, order.lockedAmount),
  );
  if (leftover <= 0) return;

  await ledgerService.post(order.user, [
    {
      asset: order.lockedAsset,
      type: "unlock",
      availableDelta: leftover,
      lockedDelta: -leftover,
      refType: "order",
      refId: String(order._id),
      meta: { reason: "unused funds returned after fill" },
    },
  ]);
}

/* ===================================================================== */
/*  3. CANCELLING                                                        */
/* ===================================================================== */

async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw ApiError.notFound("Order not found");

  if (order.status === "filled" || order.status === "cancelled") {
    throw ApiError.badRequest(`This order is already ${order.status}`);
  }

  // Give back whatever is still being held for it.
  await releaseLeftoverLock(order);

  order.status = "cancelled";
  order.closedAt = new Date();
  await order.save();

  return toApi(order);
}

/* ===================================================================== */
/*  4. READING                                                           */
/* ===================================================================== */

async function listOrders(userId, { status, page = 1, limit = 50 } = {}) {
  const filter = { user: userId };

  if (status === "open") filter.status = { $in: ["open", "partial"] };
  else if (status === "closed") filter.status = { $in: ["filled", "cancelled"] };
  else if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders: orders.map(toApi),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

async function listFills(userId, { page = 1, limit = 50 } = {}) {
  const [fills, total] = await Promise.all([
    Fill.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Fill.countDocuments({ user: userId }),
  ]);

  return {
    fills: fills.map((f) => ({
      ...f,
      id: String(f._id),
      order: String(f.order),
      key: getAsset(f.asset)?.key || f.asset.toLowerCase(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
    feeRates: FEES,
  };
}

module.exports = {
  placeOrder,
  cancelOrder,
  listOrders,
  listFills,
  executeFill,
  limitIsFillable,
  toApi,
};
