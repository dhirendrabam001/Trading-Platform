const mongoose = require("mongoose");

/**
 * One message for one user.
 *
 * These are created by real events — an order filling, a deposit landing, a
 * new sign-in — not written by hand. See services/notificationService.js.
 *
 * "Read" is stored as a DATE, not a true/false flag. A date can answer both
 * questions ("has it been read?" and "when?"), a boolean only answers one.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Matches the tabs on the Notifications page
    category: {
      type: String,
      required: true,
      enum: ["Trade", "Security", "Wallet", "Alert", "System"],
    },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 500 },

    // null = unread
    readAt: { type: Date, default: null },

    // Lets the UI link a notification to the thing it is about
    refType: { type: String, default: null },
    refId: { type: String, default: null },
  },
  { timestamps: true },
);

// The page loads newest first, and the bell counts unread
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };
