const mongoose = require("mongoose");

/**
 * One execution of an order. This is what the Trade History page shows.
 *
 * A fill is the moment money actually moves. Each fill writes ledger entries,
 * so if you ever want to know "why is my balance this number?", the answer is
 * always: the ledger, and the fills that created it.
 */
const fillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    asset: { type: String, required: true, uppercase: true, trim: true },
    pair: { type: String, required: true },
    side: { type: String, required: true, enum: ["buy", "sell"] },

    role: { type: String, required: true, enum: ["maker", "taker"] },

    price: { type: Number, required: true },
    qty: { type: Number, required: true },

    // qty * price, in USDT
    value: { type: Number, required: true },

    fee: { type: Number, required: true, default: 0 },
    feeAsset: { type: String, required: true, default: "USDT" },

    // Only set on sells. Profit or loss compared to what the coins cost us.
    realisedPnl: { type: Number, default: 0 },
  },
  { timestamps: true },
);

fillSchema.index({ user: 1, createdAt: -1 });

const Fill = mongoose.model("Fill", fillSchema);

module.exports = { Fill };
