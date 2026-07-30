const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authHead", authHeader);

    // 1. Check header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // 2. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user
    req.user = decoded;

    next();
  } catch (error) {
    // 6. Handle specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = { authMiddleware };
