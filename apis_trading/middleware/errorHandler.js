const { ApiError } = require("../utils/ApiError");

/**
 * 404 for any route that did not match. Registered after all routes.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * The single place errors become responses.
 *
 * Known (operational) failures report their own message. Everything else is
 * an unexpected fault: logged in full server-side, reported to the client as
 * a plain 500 with no internal detail. Leaking a Mongo error or a stack trace
 * to the browser hands an attacker your schema.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies the error
// handler by its four-argument signature; dropping `next` breaks it.
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Translate the framework/driver errors we expect into clean 4xx responses
  if (!(error instanceof ApiError)) {
    if (err.name === "ValidationError") {
      error = ApiError.badRequest(
        "Validation failed",
        Object.values(err.errors || {}).map((e) => e.message),
      );
    } else if (err.name === "CastError") {
      error = ApiError.badRequest(`Invalid ${err.path}`);
    } else if (err.code === 11000) {
      // duplicate key — report the field, never the raw driver message
      const field = Object.keys(err.keyValue || {})[0] || "value";
      error = ApiError.conflict(`That ${field} is already in use`);
    } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      error = ApiError.unauthorized("Invalid or expired token");
    }
  }

  const isKnown = error instanceof ApiError;
  const statusCode = isKnown ? error.statusCode : 500;

  if (!isKnown || statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message: isKnown ? error.message : "Internal server error",
    ...(isKnown && error.details ? { details: error.details } : {}),
  });
};

module.exports = { errorHandler, notFoundHandler };
