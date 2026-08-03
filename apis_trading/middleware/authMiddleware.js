const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    // console.log("Cookies:", req.cookies);
    // console.log("Token:", req.cookies.token);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Please login first" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decode", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authMiddleware };
