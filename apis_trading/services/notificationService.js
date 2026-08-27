const { Notification } = require("../models/notification.model");
const realtimeService = require("./realtimeService");

/**
 * Creates notifications when things actually happen.
 *
 * The Navbar bell currently shows a hardcoded "5". Once the frontend reads
 * /api/notifications/unread-count, that number becomes real.
 *
 * IMPORTANT: notifying must never break the thing it is reporting on. If
 * writing a notification fails, the trade that triggered it has already
 * happened and is still valid — so every failure here is logged and
 * swallowed, never thrown.
 */
async function notify(userId, category, title, body, ref = {}) {
  try {
    const created = await Notification.create({
      user: userId,
      category,
      title,
      body,
      refType: ref.refType || null,
      refId: ref.refId ? String(ref.refId) : null,
    });

    // The bell can update the moment this happens instead of on a timer
    realtimeService.notification(userId, {
      id: String(created._id),
      category: created.category,
      title: created.title,
      body: created.body,
      createdAt: created.createdAt,
    });

    return created;
  } catch (error) {
    console.error("[notify] failed:", error.message);
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/*  Ready-made messages for the events we care about                      */
/* ---------------------------------------------------------------------- */

const money = (n) =>
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** An order filled (fully or partly) */
function orderFilled(order, fill) {
  const fullyFilled = order.status === "filled";
  const side = order.side === "buy" ? "Buy" : "Sell";

  return notify(
    order.user,
    "Trade",
    fullyFilled
      ? `Order filled — ${order.pair}`
      : `Order partially filled — ${order.asset}`,
    fullyFilled
      ? `Your ${side.toLowerCase()} of ${fill.qty} ${order.asset} filled at $${money(fill.price)}.`
      : `${order.filled} of ${order.amount} ${order.asset} filled at $${money(fill.price)}. The rest is still working.`,
    { refType: "order", refId: order._id },
  );
}

/** Money arrived */
function depositCredited(userId, asset, amount, network) {
  return notify(
    userId,
    "Wallet",
    "Deposit credited",
    `${amount} ${asset} arrived${network ? ` over ${network}` : ""} and is available to trade.`,
    { refType: "transfer" },
  );
}

/** Money left */
function withdrawalSent(userId, asset, amount, address) {
  return notify(
    userId,
    "Wallet",
    "Withdrawal completed",
    `${amount} ${asset} was sent${address ? ` to ${address}` : ""}.`,
    { refType: "transfer" },
  );
}

/** Someone signed in */
function newSignIn(userId, device) {
  return notify(
    userId,
    "Security",
    "New sign-in detected",
    `${device || "A new device"} signed in to your account. If this was not you, secure your account now.`,
    { refType: "session" },
  );
}

module.exports = {
  notify,
  orderFilled,
  depositCredited,
  withdrawalSent,
  newSignIn,
};
