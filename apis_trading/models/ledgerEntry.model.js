const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Symbol from config/assets.js, e.g. "BTC". Stored directly rather than
    // as a reference so the hottest queries in the app need no populate().
    asset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "deposit",
        "withdrawal",
        "trade_buy",
        "trade_sell",
        "fee",
        "lock",
        "unlock",
        "adjustment",
      ],
    },

    availableDelta: { type: Number, required: true, default: 0 },
    lockedDelta: { type: Number, required: true, default: 0 },

    // The resulting balance, written at post time. Makes the Transactions
    // page renderable without replaying history, and lets the reconcile job
    // find the exact entry where a drift began.
    availableAfter: { type: Number, required: true },
    lockedAfter: { type: Number, required: true },

    refType: {
      type: String,
      enum: ["order", "fill", "transfer", "manual", null],
      default: null,
    },
    refId: { type: String, default: null },

    // Free-form context for the UI: network, address, pair label, fee rate…
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// The Transactions page reads newest-first per user, optionally by type
ledgerEntrySchema.index({ user: 1, createdAt: -1 });
ledgerEntrySchema.index({ user: 1, asset: 1, createdAt: -1 });
ledgerEntrySchema.index({ user: 1, type: 1, createdAt: -1 });

/**
 * Hard block on mutation. The immutability rule above is worth nothing if a
 * future controller can call .save() on a fetched entry, so it is enforced by
 * the model rather than left to discipline.
 */
// Mongoose 9 dropped the next() callback style for middleware — a hook
// signals failure by throwing, and declaring a `next` parameter throws
// "next is not a function" instead of blocking anything.
const blockMutation = function () {
  throw new Error("Ledger entries are immutable — post a compensating entry");
};

ledgerEntrySchema.pre("updateOne", blockMutation);
ledgerEntrySchema.pre("updateMany", blockMutation);
ledgerEntrySchema.pre("findOneAndUpdate", blockMutation);
ledgerEntrySchema.pre("deleteOne", blockMutation);
ledgerEntrySchema.pre("deleteMany", blockMutation);
ledgerEntrySchema.pre("findOneAndDelete", blockMutation);

ledgerEntrySchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error("Ledger entries are immutable");
  }
});

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);

module.exports = { LedgerEntry };
