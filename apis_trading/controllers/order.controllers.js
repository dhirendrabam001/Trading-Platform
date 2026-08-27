const { asyncHandler } = require("../utils/asyncHandler");
const orderService = require("../services/orderService");
const ledgerService = require("../services/ledgerService");
const { FEES, ORDER } = require("../config/trading");
const { QUOTE_ASSET } = require("../config/assets");

/** POST /api/orders — place a new order */
const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message:
      order.status === "filled"
        ? "Order filled"
        : "Order placed and waiting for your price",
    order,
    // Sent back so the Buy/Sell page can refresh balances without a
    // second request right after placing a trade.
    balances: await ledgerService.getBalances(req.user.id),
  });
});

/** GET /api/orders?status=open|closed|all — Orders and Pending Order pages */
const getOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.listOrders(req.user.id, {
    status,
    page,
    limit,
  });

  res.json({ success: true, ...result });
});

/** DELETE /api/orders/:id — cancel an open order */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);

  res.json({
    success: true,
    message: "Order cancelled and your funds released",
    order,
  });
});

/** GET /api/orders/fills — Trade History page */
const getFills = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.listFills(req.user.id, { page, limit });

  res.json({ success: true, ...result });
});

/**
 * GET /api/orders/rules
 *
 * The Buy/Sell page needs the fee rates and the minimum order size. Sending
 * them from here means the page never has to hardcode a number that could
 * drift out of step with what the server actually charges.
 */
const getRules = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    quote: QUOTE_ASSET,
    fees: FEES,
    minNotional: ORDER.minNotionalQuote,
    maxOpenOrders: ORDER.maxOpenOrders,
    orderTypes: ["market", "limit", "stop_limit"],
  });
});

module.exports = { createOrder, getOrders, cancelOrder, getFills, getRules };
