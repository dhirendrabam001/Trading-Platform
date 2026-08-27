const { ApiError } = require("../utils/ApiError");

/**
 * Requires an admin role. Must be mounted AFTER authMiddleware, which is what
 * puts the decoded token on req.user.
 *
 * authMiddleware only proves someone is signed in — it lets any ordinary user
 * through. Without this, the first admin endpoint added to the API would be
 * callable by every registered account.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  if (req.user.role !== "admin") {
    return next(ApiError.forbidden("Administrator access required"));
  }

  return next();
};

module.exports = { adminMiddleware };
