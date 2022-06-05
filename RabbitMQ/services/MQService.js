const amqp = require('amqplib/callback_api');

const CONN_URL = 'amqps://svhexlio:pouZH33UIKA8cpbhVYfLMJ11DliQlZbX@puffin.rmq2.cloudamqp.com/svhexlio';

let ch = null;
amqp.connect(CONN_URL, function (err, conn) {
   conn.createChannel(function (err, channel) {
      ch = channel;
   });
});
module.exports = {
	publishToQueue: async (queueName, data) => {
   ch.sendToQueue(queueName, new Buffer(data));
}
}
process.on('exit', (code) => {
   ch.close();
   console.log(`Closing rabbitmq channel`);
});