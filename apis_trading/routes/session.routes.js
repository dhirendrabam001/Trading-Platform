const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getSessions } = require("../controllers/session.controllers");
const router = express.Router();

router.get("/getSessions", authMiddleware, getSessions);

module.exports = router;
