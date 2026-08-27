const { asyncHandler } = require("../utils/asyncHandler");
const portfolioService = require("../services/portfolioService");

/** GET /api/portfolio/summary — Dashboard cards and Portfolio header */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await portfolioService.getSummary(req.user.id);
  res.json({ success: true, summary });
});

/** GET /api/portfolio/holdings — Portfolio table and allocation chart */
const getHoldings = asyncHandler(async (req, res) => {
  const { rows, cash, invested } = await portfolioService.getHoldings(
    req.user.id,
  );

  res.json({
    success: true,
    cash,
    invested,
    holdings: rows,
  });
});

/** GET /api/portfolio/pnl?days=30 — Profit & Loss page */
const getPnl = asyncHandler(async (req, res) => {
  const pnl = await portfolioService.getPnl(req.user.id, {
    days: req.query.days,
  });
  res.json({ success: true, ...pnl });
});

/** GET /api/portfolio/performance?days=90 — Performance Report page */
const getPerformance = asyncHandler(async (req, res) => {
  const performance = await portfolioService.getPerformance(req.user.id, {
    days: req.query.days,
  });
  res.json({ success: true, ...performance });
});

module.exports = { getSummary, getHoldings, getPnl, getPerformance };
