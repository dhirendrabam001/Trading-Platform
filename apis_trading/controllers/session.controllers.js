const { Session } = require("../models/session.model");
const crypto = require("crypto");

// Create Session
const createSession = async (userId, req) => {
  const userAgent = req.headers["user-agent"] || "Unknown";

  const sessionToken = crypto.randomBytes(32).toString("hex");

  const ipAddress =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

  // Make old sessions non-current
  await Session.updateMany(
    {
      user: userId,
      status: "active",
    },
    {
      $set: {
        isCurrent: false,
      },
    },
  );

  // Create new session
  const session = await Session.create({
    user: userId,
    device: userAgent,
    browser: "Unknown",
    os: "Unknown",
    ipAddress,
    sessionToken,
    isCurrent: true,
    status: "active",
    lastActive: new Date(),
  });

  return session;
};

// Get Sessions
const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({
      user: userId,
      status: "active",
    })
      .sort({
        isCurrent: -1,
        lastActive: -1,
      })
      .select("-sessionToken");

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get sessions",
    });
  }
};

module.exports = {
  createSession,
  getSessions,
};
