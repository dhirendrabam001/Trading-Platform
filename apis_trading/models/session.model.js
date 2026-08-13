const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    device: {
      type: String,
      default: "Unknown Device",
    },

    browser: {
      type: String,
      default: "Unknown",
    },

    os: {
      type: String,
      default: "Unknown",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = { Session };
