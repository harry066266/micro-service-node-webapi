const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;
const EXCHANGE_NAME = "post_exchange";

async function connectToRabbitMQ(retries = 5, delay = 3000) {
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


async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });

  logger.info(`Subscribed to event: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, consumeEvent };
