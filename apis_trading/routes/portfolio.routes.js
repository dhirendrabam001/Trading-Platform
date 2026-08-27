const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getSummary,
  getHoldings,
  getPnl,
  getPerformance,
} = require("../controllers/portfolio.controllers");

const router = express.Router();

// The pages offer 7D / 30D / 90D / 1Y buttons, so cap the window at a year.
const rangeQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const performanceQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90),
});

router.use(authMiddleware);

router.get("/summary", getSummary);
router.get("/holdings", getHoldings);
router.get("/pnl", validate(rangeQuery, "query"), getPnl);
router.get("/performance", validate(performanceQuery, "query"), getPerformance);

module.exports = router;
