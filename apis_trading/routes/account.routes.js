const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const upload = require("../middleware/multer.middleware");

const notifications = require("../controllers/notification.controllers");
const bankAccounts = require("../controllers/bankAccount.controllers");
const support = require("../controllers/support.controllers");
const kyc = require("../controllers/kyc.controllers");

/**
 * The account-area routes: notifications, bank accounts, support and KYC.
 *
 * Grouped in one file because they are all small and all mounted the same
 * way. Each router below is exported separately and mounted under its own
 * path in index.js.
 */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const idParam = z.object({ id: objectId });

/* ------------------------------------------------------ NOTIFICATIONS */
const notificationRouter = express.Router();
notificationRouter.use(authMiddleware);

const notificationQuery = z.object({
  category: z.enum(["Trade", "Security", "Wallet", "Alert", "System"]).optional(),
  unreadOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Declared before "/:id" so it is not read as an id
notificationRouter.get("/unread-count", notifications.unreadCount);
notificationRouter.get("/", validate(notificationQuery, "query"), notifications.list);
notificationRouter.post("/read-all", notifications.markAllRead);
notificationRouter.patch("/:id/read", validate(idParam, "params"), notifications.markRead);
notificationRouter.delete("/:id", validate(idParam, "params"), notifications.remove);

/* ------------------------------------------------------ BANK ACCOUNTS */
const bankRouter = express.Router();
bankRouter.use(authMiddleware);

const bankBody = z.object({
  bank: z.string().min(2).max(80),
  holder: z.string().min(2).max(80),
  // Only the last 4 digits are kept — see bankAccount.model.js
  accountNumber: z.string().min(4).max(34),
  type: z.enum(["Savings", "Current", "Checking"]).default("Savings"),
  currency: z.string().min(3).max(3).default("USD"),
  country: z.string().max(60).optional(),
  swift: z.string().max(15).optional(),
});

bankRouter.get("/", bankAccounts.list);
bankRouter.post("/", validate(bankBody), bankAccounts.create);
bankRouter.patch("/:id/default", validate(idParam, "params"), bankAccounts.setDefault);
bankRouter.delete("/:id", validate(idParam, "params"), bankAccounts.remove);

/* ------------------------------------------------------------ SUPPORT */
const supportRouter = express.Router();
supportRouter.use(authMiddleware);

const ticketBody = z.object({
  subject: z.string().min(4).max(160),
  category: z
    .enum(["Account", "Deposits", "Withdrawals", "Trading", "Security", "Other"])
    .default("Other"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  message: z.string().min(4).max(4000),
});

const replyBody = z.object({ message: z.string().min(1).max(4000) });
const ticketQuery = z.object({ status: z.enum(["open", "closed", "all"]).optional() });

supportRouter.get("/tickets", validate(ticketQuery, "query"), support.list);
supportRouter.post("/tickets", validate(ticketBody), support.create);
supportRouter.get("/tickets/:id", validate(idParam, "params"), support.getOne);
supportRouter.post(
  "/tickets/:id/messages",
  validate(idParam, "params"),
  validate(replyBody),
  support.reply,
);
supportRouter.patch("/tickets/:id/close", validate(idParam, "params"), support.close);

/* ---------------------------------------------------------------- KYC */
const kycRouter = express.Router();
kycRouter.use(authMiddleware);

const stepParam = z.object({
  step: z.enum(["email", "phone", "identity", "address", "selfie"]),
});

const reviewBody = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(300).optional(),
});

kycRouter.get("/", kyc.getStatus);

// upload.single runs before validate so multer can parse the multipart body —
// without it req.body would still be empty here.
kycRouter.post(
  "/:step",
  validate(stepParam, "params"),
  upload.single("document"),
  kyc.submitStep,
);

// Admin only. authMiddleware proves who they are, adminMiddleware proves
// they are allowed to approve someone else's identity documents.
kycRouter.patch(
  "/:userId/:step/review",
  adminMiddleware,
  validate(
    z.object({ userId: objectId, step: stepParam.shape.step }),
    "params",
  ),
  validate(reviewBody),
  kyc.reviewStep,
);

module.exports = { notificationRouter, bankRouter, supportRouter, kycRouter };
