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

/**
 * Revoke Session — the "sign out this device" button on the Security page.
 *
 * The session is marked revoked rather than deleted, so the security log
 * still shows that the device existed and when it was cut off.
 *
 * The current session cannot be revoked here: that is what Logout is for,
 * and letting it happen would leave the user on a page whose session no
 * longer exists.
 */
const revokeSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.isCurrent) {
      return res.status(400).json({
        success: false,
        message: "Use Logout to end the session you are using right now",
      });
    }

    session.status = "revoked";
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Device signed out",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to revoke session" });
  }
};

module.exports = {
  createSession,
  getSessions,
  revokeSession,
};
