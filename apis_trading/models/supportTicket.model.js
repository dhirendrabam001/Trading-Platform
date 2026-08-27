const mongoose = require("mongoose");

/**
 * A support conversation.
 *
 * Messages live inside the ticket rather than in their own collection. A
 * ticket has a handful of messages and they are always read together, so
 * keeping them here means one query instead of two.
 */
const messageSchema = new mongoose.Schema(
  {
    // "you" = the customer, "agent" = support staff.
    // The frontend already uses these exact words.
    from: { type: String, required: true, enum: ["you", "agent"] },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true, _id: true },
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Human-friendly reference such as TKT-4821, shown in the UI
    ref: { type: String, required: true, unique: true },

    subject: { type: String, required: true, trim: true, maxlength: 160 },

    category: {
      type: String,
      required: true,
      enum: ["Account", "Deposits", "Withdrawals", "Trading", "Security", "Other"],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },

    status: {
      type: String,
      enum: ["Awaiting Reply", "In Progress", "Awaiting You", "Resolved", "Closed"],
      default: "Awaiting Reply",
    },

    messages: { type: [messageSchema], default: [] },

    // How many agent replies the user has not opened yet
    unread: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

supportTicketSchema.index({ user: 1, updatedAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

module.exports = { SupportTicket };
