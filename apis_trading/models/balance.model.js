const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    asset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    // Spendable right now
    available: { type: Number, required: true, default: 0, min: 0 },

    // Committed to open orders. Still owned, not spendable.
    locked: { type: Number, required: true, default: 0, min: 0 },

    avgCost: { type: Number, required: true, default: 0 },
    totalCost: { type: Number, required: true, default: 0 },

    // Accumulated realised P&L on this asset, added to as positions close
    realisedPnl: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

// One row per user per asset — this is also the concurrency guard, since a
// duplicate key error is what stops two simultaneous requests each creating
// their own balance row for the same asset.
balanceSchema.index({ user: 1, asset: 1 }, { unique: true });

// Convenience for the Wallet page: total held, spendable or not
balanceSchema.virtual("total").get(function () {
  return this.available + this.locked;
});

balanceSchema.set("toJSON", { virtuals: true });
balanceSchema.set("toObject", { virtuals: true });

const Balance = mongoose.model("Balance", balanceSchema);

module.exports = { Balance };
