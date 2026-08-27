const { Order } = require("../models/order.model");
const priceService = require("./priceService");
const orderService = require("./orderService");

/**
 * Watches open orders and fills them when the price reaches them.
 *
 * How it works, in plain terms:
 *
 *   every few seconds
 *     -> get all orders that are still waiting
 *     -> for each one, look up the current price of its coin
 *     -> if the price has reached the order's price, fill it
 *
 * That is the whole idea. No queue, no background workers, no message bus.
 */

const TICK_MS = 3000;

let timer = null;
let running = false; // stops two ticks overlapping if one is slow

async function tick() {
  // If the previous tick has not finished, skip this one. Without this, a
  // slow database could start a second pass over the same orders and fill
  // them twice.
  if (running) return;
  running = true;

  try {
    const openOrders = await Order.find({
      status: { $in: ["open", "partial"] },
      type: { $in: ["limit", "stop_limit"] },
    }).limit(500);

    for (const order of openOrders) {
      try {
        await checkOrder(order);
      } catch (error) {
        // One bad order must never stop the others from being processed.
        console.error(
          `[engine] order ${order._id} failed:`,
          error.message,
        );
      }
    }
  } catch (error) {
    console.error("[engine] tick failed:", error.message);
  } finally {
    running = false;
  }
}

/**
 * Decide whether one order should fill right now.
 */
async function checkOrder(order) {
  // Only orders that are still working can fill. The tick() query already
  // filters on this, but checking here too means calling checkOrder directly
  // on a finished order does nothing instead of logging a phantom fill.
  if (order.status !== "open" && order.status !== "partial") return;

  const price = priceService.getPrice(order.asset);

  // No price, or a stale one. Do nothing — filling an order at a guessed
  // price is worse than filling it a few seconds later.
  if (price === null) return;

  // ---- stop orders have to wake up first -------------------------------
  // A stop order is asleep until the market touches its trigger price.
  // Once triggered it behaves exactly like a normal limit order.
  if (order.type === "stop_limit" && order.triggerPrice) {
    const triggered =
      order.side === "buy"
        ? price >= order.triggerPrice // buy stop: breakout upwards
        : price <= order.triggerPrice; // sell stop: protection downwards

    if (!triggered) return;

    // Convert it into a plain limit order so it never re-triggers.
    order.type = "limit";
    await order.save();
  }

  // ---- normal limit check ---------------------------------------------
  if (!orderService.limitIsFillable(order.side, order.price, price)) return;

  // Fill at whichever price is BETTER for the user.
  //
  //   buying  -> never pay more than your limit, and if the market is
  //              cheaper right now, pay the cheaper price
  //   selling -> never accept less than your limit, and if the market is
  //              higher right now, take the higher price
  //
  // This is how a real exchange behaves, and it also keeps a buy fill from
  // ever costing more than the money we locked when the order was placed.
  const fillPrice =
    order.side === "buy"
      ? Math.min(order.price, price)
      : Math.max(order.price, price);

  await orderService.executeFill(order, fillPrice, "maker");

  console.log(
    `[engine] filled ${order.side} ${order.amount} ${order.asset} @ ${fillPrice}`,
  );
}

function start() {
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  console.log(`[engine] watching open orders every ${TICK_MS / 1000}s`);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, tick, checkOrder, TICK_MS };
