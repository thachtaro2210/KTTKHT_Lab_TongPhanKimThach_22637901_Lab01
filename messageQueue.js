const amqp = require('amqplib');
require('dotenv').config();

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = process.env.QUEUE_NAME || 'message_queue';
  }

  // Kết nối đến RabbitMQ
  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declare queue
      await this.channel.assertQueue(this.queueName, { durable: true });
      
      console.log('✅ RabbitMQ connected successfully!');
    } catch (error) {
      console.error('❌ RabbitMQ connection error:', error.message);
      // Retry sau 5 giây
      setTimeout(() => this.connect(), 5000);
    }
  }

  // Đẩy message vào queue
  async sendMessage(message) {
    try {
      if (!this.channel) {
        throw new Error('Channel is not initialized. Connect first!');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(this.queueName, messageBuffer, { persistent: true });
      
      console.log('📤 Message sent:', message);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      return false;
    }
  }

  // Lấy message từ queue
  async consumeMessage(callback) {
    try {
      if (!this.channel) {
        throw new Error('Channel is not initialized. Connect first!');
      }

      // Set prefetch count = 1 để lấy 1 message tại 1 lần
      await this.channel.prefetch(1);

      this.channel.consume(
        this.queueName,
        async (msg) => {
          if (msg) {
            const content = JSON.parse(msg.content.toString());
            console.log('📥 Message received:', content);

            try {
              await callback(content);
              // Acknowledge message sau khi xử lý thành công
              this.channel.ack(msg);
            } catch (error) {
              console.error('❌ Error processing message:', error);
              // Nack message để đưa lại vào queue
              this.channel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      console.log('👂 Waiting for messages...');
    } catch (error) {
      console.error('❌ Error consuming message:', error.message);
    }
  }

  // Đóng kết nối
  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('✅ RabbitMQ connection closed');
    } catch (error) {
      console.error('❌ Error closing connection:', error);
    }
  }
}

module.exports = new MessageQueue();
