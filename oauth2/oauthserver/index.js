const express = require('express')
const mongoose = require('mongoose')
var port = process.env.PORT || 5000
const bodyParser = require('body-parser')

const app = express()

const oauthServer = require('./oauth/server.js')

//Connect with DB
mongoose.connect('mongodb+srv://swapnilifttt:Swapnil1234IFTTT@cluster0.fxohi.mongodb.net/secondDatabase?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
  	autoIndex: true
})

//Middle-Wares
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/client', require('./routes/client.js')) // Client routes
app.use('/oauth', require('./routes/auth.js')) // routes to access the auth stuff

app.use('/secure', (req,res,next) => {
  console.log('Authentication Starts')
  return next()
},oauthServer.authenticate(), require('./routes/secure.js'))

app.use('/', (req,res) => res.redirect('/client'))
// ('/')
/*app.get('/', (req, res) => {
	res.send('Yet again Hello World _/\\_');
})*/


app.listen(port)