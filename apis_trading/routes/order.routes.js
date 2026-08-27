const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrders,
  cancelOrder,
  getFills,
  getRules,
} = require("../controllers/order.controllers");

const router = express.Router();

const positiveNumber = z
  .coerce.number()
  .refine(Number.isFinite, "Must be a number")
  .positive("Must be greater than zero");

const createBody = z.object({
  asset: z.string().min(2).max(10),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop_limit"]),
  amount: positiveNumber,
  price: positiveNumber.optional(),
  triggerPrice: positiveNumber.optional(),
});

const listQuery = z.object({
  status: z.enum(["open", "closed", "filled", "cancelled", "all"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const idParam = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id"),
});

router.use(authMiddleware);

// "/fills" and "/rules" must be declared BEFORE "/:id" style routes, or
// Express would try to read them as an order id.
router.get("/rules", getRules);
router.get("/fills", validate(pageQuery, "query"), getFills);

router.get("/", validate(listQuery, "query"), getOrders);
router.post("/", validate(createBody), createOrder);
router.delete("/:id", validate(idParam, "params"), cancelOrder);

module.exports = router;
