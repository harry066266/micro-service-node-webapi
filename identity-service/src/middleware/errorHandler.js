const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  res.status(err.status || 500).json({
    message: err.message || "internal server error",
  });
};

module.exports = errorHandler;
