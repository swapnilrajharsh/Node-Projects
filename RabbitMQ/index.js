/**
 * /action
 * (A)
 * 1. req recv
 * 2. retrieve data from db #2s
 * 3. update data from db #2s
 * 4. res send 200 OK
 * -------------------------
 * 4s
 * -------------------------
 * (B)
 * 1. req recv
 * 2. msg queue
 * 3. res send 200 OK
 * 4. Will consume the queue (4s/req)
 * ----------------------------------
 * 
 * Existing Action
 * ----------------------------------
 * 1. IFTTT Action Endpoint on our product service
 * (B) #2,3,4()
 * ----------------------------------
 * Simulate n number of request to product service ??
 * */
/* const express = require('express'),
    app = express(),
    server = require('http').createServer(app);

server.maxConnections = 10;*/
var bodyParser = require('body-parser');
const { publishToQueue } = require('./services/MQService');
var mongoose = require("mongoose");
var Book = require("./model/Book");

const express = require('express'),
    app = express(),
    server = require('http').createServer(app);

/*server.maxConnections = 2000;*/

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = "mongodb://localhost:27017/example";
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });

const conSuccess = mongoose.connection
conSuccess.once('open', _ => {
  console.log('Database connected:', db)
})

conSuccess.on('error', err => {
  console.error('connection error:', err)
})

app.get('/', (req, res)=> {
	return res.send("OK")
})

app.post('/process', async(req, res)=> {
    const { queueName, payload } = req.body
    /*await publishToQueue(queueName, payload);*/
    /*await new Promise(resolve => setTimeout(resolve, 10000))*/;
    delayComputation()
    console.log("Message:", payload, " timestamp : ", Date.now());
    /*console.log("Message:");*/

    res.statusCode = 200;
    return res.send({ "message-sent":true });
})

app.post('/books', (req, res)=> {
    // console.log("get all books");
    Book.find({}).
        exec(function(err, books){
            if(err){
              res.send("error has occured");
            } else {
              console.log(books);
              res.json(books);
            }
      });
})

function delayComputation() {
    let x = 0
    for (let i=0; i< 4000000000; i++) {
        x = 0;
    }
}

/*app.listen(5000) */
server.listen(5000)