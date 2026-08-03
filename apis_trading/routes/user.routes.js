const express = require("express");
const {
  register,
  login,
  profile,
  logout,
} = require("../controllers/user.controllers");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", authMiddleware, profile);
router.post("/logout", logout);

module.exports = router;
