const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getBalances,
  getLimits,
  deposit,
  withdraw,
  getLedger,
  reconcile,
} = require("../controllers/wallet.controllers");

const router = express.Router();

// Rejected here rather than deep in the ledger: a NaN, an Infinity or a
// negative amount must never reach a balance calculation.
const amount = z
  .coerce.number()
  .refine(Number.isFinite, "Amount must be a number")
  .positive("Amount must be greater than zero");

const transferBody = z.object({
  asset: z.string().min(2).max(10),
  amount,
  network: z.string().max(40).optional(),
  address: z.string().max(120).optional(),
});

const ledgerQuery = z.object({
  type: z
    .enum(["deposit", "withdrawal", "trade_buy", "trade_sell", "fee", "adjustment"])
    .optional(),
  asset: z.string().min(2).max(10).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  includeInternal: z.coerce.boolean().default(false),
});

router.use(authMiddleware);

router.get("/balances", getBalances);
router.get("/limits", getLimits);
router.get("/ledger", validate(ledgerQuery, "query"), getLedger);
router.get("/reconcile", reconcile);

router.post("/deposit", validate(transferBody), deposit);
router.post("/withdraw", validate(transferBody), withdraw);

module.exports = router;
