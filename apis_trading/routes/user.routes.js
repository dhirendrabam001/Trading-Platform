const express = require("express");
const {
  register,
  login,
  profile,
  logout,
  getProfile,
} = require("../controllers/user.controllers");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer.middleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getProfile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, upload.single("profileImage"), profile);
router.post("/logout", logout);

module.exports = router;
