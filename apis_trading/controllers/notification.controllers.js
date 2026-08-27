const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { Notification } = require("../models/notification.model");

/**
 * Groups notifications the way the page displays them.
 * Anything older than yesterday goes into "Earlier".
 */
function dayLabel(date) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return "Earlier";
}

function toApi(n) {
  return {
    id: String(n._id),
    category: n.category,
    title: n.title,
    body: n.body,
    read: n.readAt !== null,
    readAt: n.readAt,
    day: dayLabel(n.createdAt),
    time: n.createdAt.toISOString().slice(11, 16), // HH:MM
    createdAt: n.createdAt,
    refType: n.refType,
    refId: n.refId,
  };
}

/** GET /api/notifications?category=Trade&unreadOnly=true */
const list = asyncHandler(async (req, res) => {
  const { category, unreadOnly, page, limit } = req.query;

  const filter = { user: req.user.id };
  if (category) filter.category = category;
  if (unreadOnly) filter.readAt = null;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, readAt: null }),
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    unread,
    notifications: items.map(toApi),
  });
});

/**
 * GET /api/notifications/unread-count
 *
 * This is what the Navbar bell should read. Right now it shows a hardcoded
 * "5"; pointing it here makes the badge real.
 */
const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({
    user: req.user.id,
    readAt: null,
  });

  res.json({ success: true, unread });
});

/** PATCH /api/notifications/:id/read */
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    // The user filter is what stops someone marking somebody else's
    // notification read by guessing an id.
    { _id: req.params.id, user: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true },
  );

  if (!notification) throw ApiError.notFound("Notification not found");

  res.json({ success: true, notification: toApi(notification) });
});

/** POST /api/notifications/read-all */
const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user.id, readAt: null },
    { $set: { readAt: new Date() } },
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} marked as read`,
    updated: result.modifiedCount,
  });
});

/** DELETE /api/notifications/:id */
const remove = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (result.deletedCount === 0) throw ApiError.notFound("Notification not found");

  res.json({ success: true, message: "Notification removed" });
});

module.exports = { list, unreadCount, markRead, markAllRead, remove };
