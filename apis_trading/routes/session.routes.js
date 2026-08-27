const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getSessions,
  revokeSession,
} = require("../controllers/session.controllers");
const router = express.Router();

router.get("/getSessions", authMiddleware, getSessions);
router.patch("/:id/revoke", authMiddleware, revokeSession);

module.exports = router;
