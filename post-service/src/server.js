require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const helemt = require("helmet");
const moongoose = require("mongoose");
const Redis = require("ioredis");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const { connectRabbitMQ } = require("./utils/rabbitmq");
const app = express();
const PORT = process.env.PORT || 3002;

moongoose
  .connect(process.env.MONGO_DB_URL)
  .then(() => {
    logger.info("Connected to mongodb");
  })
  .catch((e) => {
    logger.error("Mongo connection error", e);
  });
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helemt());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
