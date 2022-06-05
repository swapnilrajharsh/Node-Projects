const express = require('express')
const app = express()

// Initialize MQTT Client
const mqtt = require('mqtt') 
//the client id is used by the MQTT broker to keep track of clients and and their // state
const clientId = 'mqttjs_' + Math.random().toString(8).substr(2, 4) 
var options = {
    host: '236823d0c3344239b9986f357a2be29c.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'mqttpoc',
    password: 'SwapnilMQTT123'
}

//initialize the MQTT client
var client = mqtt.connect(options);

//setup the callbacks
client.on('connect', function () {
    console.log('Connected');
});

client.on('error', function (error) {
    console.log(error);
});

app.get('/', (req, res) => {
	// publish message 'Hello' to topic 'my/test/topic'
	client.publish('alpha', 'Hello');
	res.send("Ok Tested!!")
})

app.get('/publish', (req, res) => {
	var topic = req.query.topic
	var message = req.query.message
	if (topic != null) {
		const payload = {1: "Hello world", 2: message} 
  		client.publish(topic, JSON.stringify(payload), {qos: 1, retain: false}, (PacketCallback, err) => { 
      	if(err) { 
          console.log(err, 'MQTT publish packet') 
      	}
      }) 
		res.send('Darkhold')
	}
})

app.listen(5000)