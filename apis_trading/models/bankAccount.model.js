const mongoose = require("mongoose");

/**
 * A bank account the user has added for withdrawals.
 *
 * SECURITY NOTE: we only ever store the LAST FOUR DIGITS of the account
 * number. That is enough for the user to recognise which account is which,
 * which is all this screen needs. Storing a full account number means storing
 * something worth stealing, and it would need encryption at rest, restricted
 * access and an audit trail to hold safely. Since this is paper trading and
 * no money is ever actually sent, keeping the full number would be risk with
 * no benefit.
 */
const bankAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bank: { type: String, required: true, trim: true, maxlength: 80 },
    holder: { type: String, required: true, trim: true, maxlength: 80 },

    // Last 4 digits only — see the note above
    last4: {
      type: String,
      required: true,
      match: [/^\d{4}$/, "Must be exactly 4 digits"],
    },

    type: {
      type: String,
      enum: ["Savings", "Current", "Checking"],
      default: "Savings",
    },

    currency: { type: String, uppercase: true, trim: true, default: "USD" },
    country: { type: String, trim: true, maxlength: 60, default: "" },
    swift: { type: String, uppercase: true, trim: true, maxlength: 15, default: "" },

    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    // Exactly one account per user should be the default. The controller
    // enforces that when adding or changing one.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bankAccountSchema.index({ user: 1, createdAt: -1 });

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

module.exports = { BankAccount };
