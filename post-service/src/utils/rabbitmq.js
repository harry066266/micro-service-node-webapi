const amqp = require("amqplib");
const logger = require("./logger");
let connection = null;
let channel = null;

const EXCHANG_NAME = "post_exchange";

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANG_NAME, "topic", {
      durable: true,
    });
    return channel;
  } catch (error) {
    logger.error("Error connecting to rabbit mq", error);
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
