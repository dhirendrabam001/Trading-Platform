const { ApiError } = require("../utils/ApiError");

const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join(".") || source,
        message: i.message,
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }

    // req.query and req.params are getter-only in Express 5, so assign the
    // parsed value onto a own-property instead of mutating in place.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
    });

    return next();
  };

module.exports = { validate };
