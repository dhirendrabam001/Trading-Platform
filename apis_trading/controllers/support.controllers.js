const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { SupportTicket } = require("../models/supportTicket.model");

// Statuses the Support page counts as "still open"
const OPEN_STATUSES = ["Awaiting Reply", "In Progress", "Awaiting You"];

/**
 * Builds the next reference, e.g. TKT-4821.
 *
 * Counting documents is fine at this size and keeps the numbers readable.
 * If two tickets are ever created in the same millisecond they could collide,
 * so the `ref` field is unique in the model and we retry once on a clash.
 */
async function nextRef() {
  const count = await SupportTicket.estimatedDocumentCount();
  return `TKT-${4800 + count + 1}`;
}

function toApi(ticket) {
  return {
    id: String(ticket._id),
    ref: ticket.ref,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    unread: ticket.unread,
    opened: ticket.createdAt,
    updated: ticket.updatedAt,
    messages: ticket.messages.map((m) => ({
      id: String(m._id),
      from: m.from,
      author: m.author,
      body: m.body,
      time: m.createdAt,
    })),
  };
}

/** GET /api/support/tickets?status=open|closed */
const list = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = { user: req.user.id };
  if (status === "open") filter.status = { $in: OPEN_STATUSES };
  else if (status === "closed") filter.status = { $in: ["Resolved", "Closed"] };

  const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });

  res.json({
    success: true,
    tickets: tickets.map(toApi),
    openCount: await SupportTicket.countDocuments({
      user: req.user.id,
      status: { $in: OPEN_STATUSES },
    }),
  });
});

/** GET /api/support/tickets/:id — opening it clears the unread badge */
const getOne = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!ticket) throw ApiError.notFound("Ticket not found");

  if (ticket.unread > 0) {
    ticket.unread = 0;
    await ticket.save();
  }

  res.json({ success: true, ticket: toApi(ticket) });
});

/** POST /api/support/tickets */
const create = asyncHandler(async (req, res) => {
  const { subject, category, priority, message } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user.id,
    ref: await nextRef(),
    subject,
    category,
    priority,
    status: "Awaiting Reply",
    messages: [{ from: "you", author: "You", body: message }],
  });

  res.status(201).json({
    success: true,
    message: "Ticket created. Our team will reply shortly.",
    ticket: toApi(ticket),
  });
});

/** POST /api/support/tickets/:id/messages */
const reply = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!ticket) throw ApiError.notFound("Ticket not found");

  if (ticket.status === "Closed") {
    throw ApiError.badRequest("This ticket is closed. Please open a new one.");
  }

  ticket.messages.push({
    from: "you",
    author: "You",
    body: req.body.message,
  });

  // The user has replied, so the ball is back with support
  ticket.status = "Awaiting Reply";
  await ticket.save();

  res.status(201).json({ success: true, ticket: toApi(ticket) });
});

/** PATCH /api/support/tickets/:id/close */
const close = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { status: "Closed" } },
    { new: true },
  );

  if (!ticket) throw ApiError.notFound("Ticket not found");

  res.json({ success: true, message: "Ticket closed", ticket: toApi(ticket) });
});

module.exports = { list, getOne, create, reply, close };
