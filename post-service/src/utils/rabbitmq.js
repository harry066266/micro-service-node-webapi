const amqp = require("amqplib");
const logger = require("./logger");
let connection = null;
let channel = null;

const EXCHANG_NAME = "post_exchange";

async function connectRabbitMQ(retries = 5, delay = 3000) {
  while (retries > 0) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, "topic", {
        durable: true,
      });
      logger.info("Connected to RabbitMQ");
      return channel;
    } catch (error) {
      logger.error(`Error connecting to RabbitMQ. Retries left: ${retries - 1}`, error);
      retries--;
      if (retries === 0) {
        logger.error("Exhausted all retries. RabbitMQ connection failed.");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectRabbitMQ();
  }

  channel.publish(
    EXCHANG_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event published with routing key: ${routingKey}`);
}

module.exports = {
  connectRabbitMQ,
  publishEvent,
};
