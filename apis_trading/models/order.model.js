const mongoose = require("mongoose");

/**
 * An order the user placed.
 *
 * Simple lifecycle:
 *
 *   open  -->  filled       (fully executed)
 *         -->  partial      (some executed, still working)
 *         -->  cancelled    (user cancelled it)
 *
 * IMPORTANT: an order never changes a balance by itself.
 * It only locks money. The actual money movement happens in a Fill.
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which coin is being traded, e.g. "BTC". We always trade it against USDT.
    asset: { type: String, required: true, uppercase: true, trim: true },

    // Text label for the UI, e.g. "BTC / USDT"
    pair: { type: String, required: true },

    side: { type: String, required: true, enum: ["buy", "sell"] },

    // market      = fill right now at whatever the price is
    // limit       = only fill at my price or better
    // stop_limit  = wait until price reaches triggerPrice, then act like a limit
    type: {
      type: String,
      required: true,
      enum: ["market", "limit", "stop_limit"],
    },

    // How much of the coin the user wants (e.g. 0.5 BTC)
    amount: { type: Number, required: true, min: 0 },

    // How much has been executed so far
    filled: { type: Number, required: true, default: 0, min: 0 },

    // The price the user wants. Empty for market orders.
    price: { type: Number, default: null },

    // Only for stop_limit: the price that "wakes up" the order
    triggerPrice: { type: Number, default: null },

    // Average price actually paid/received across all fills
    avgFillPrice: { type: Number, default: 0 },

    // Total fee charged so far, in USDT
    feePaid: { type: Number, default: 0 },

    status: {
      type: String,
      required: true,
      enum: ["open", "partial", "filled", "cancelled"],
      default: "open",
    },

    // How much money we put on hold for this order, and in which asset.
    // We remember it so cancelling can give back exactly what we took.
    lockedAsset: { type: String, default: null },
    lockedAmount: { type: Number, default: 0 },

    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The Orders page lists newest first; the engine looks up orders still working.
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, asset: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
