var amqp = require('amqplib/callback_api');
const CONN_URL = 'amqps://svhexlio:pouZH33UIKA8cpbhVYfLMJ11DliQlZbX@puffin.rmq2.cloudamqp.com/svhexlio';
/*amqp.connect(CONN_URL, function (err, conn) {
  conn.createChannel(function (err, ch) {
    ch.consume('user-messages', async function (msg) {
      console.log('.....');
      setTimeout(function(){
        console.log("Message:", msg.content.toString());
      },10000);
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("Message:", msg.content.toString());
      ch.ack(msg)
      },{ noAck: false }
    );
  });
});*/

amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, ch) {
       // ch.prefetch(1)
        ch.consume('user-messages', function (msg) {
                /*console.log('.....');*/
                setTimeout(function(){
                    console.log("Message:", msg.content.toString());
                    ch.ack(msg);
                },10000);
            },{ noAck: false }
        );
    });
});