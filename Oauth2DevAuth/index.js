const express = require('express')
const crypto = require("crypto")
const mongoose = require('mongoose')
const path = require("path")
const DeviceDetails = require('./model/device.js')
const UserDetails = require('./model/user.js')
const TokenDeviceDetails = require('./model/tokendevice.js')

var int_encoder = require("int-encoder")
var bodyParser = require('body-parser')

const app = express()
// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs')

//Connect with DB
mongoose.connect('mongodb+srv://swapnilifttt:Swapnil1234IFTTT@cluster0.fxohi.mongodb.net/thirdDatabase?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
  	autoIndex: true
})

app.get('/', (req, res) => {
	res.send("OK")
})

app.get('/devicedetails', async (req, res) => {
	var user_code = generateUserCode()
	// user_code_readable = user_code.slice(0,4) + " - " + user_code.slice(4)
	var device_code = generatedDeviceCode()
	var verification_uri_complete = "http://a00c-2405-201-a416-d981-7c71-12c2-aec9-8bd3.ngrok.io/mydevice?user_code=" + user_code

	//Save to DB
	try {
		const response = await DeviceDetails.create({
			device_code,
			user_code,
			verification_uri_complete
		})
		const tokenresponse = await TokenDeviceDetails.create({ device_code })
		// console.log(response)
	} catch (error) {
		return res.json("status", "error")
	}

	//Fetch from DB
	try {
		const deviceDetails = await DeviceDetails.findOne({device_code, user_code}).lean()
		return res.json({ device_code: deviceDetails.device_code,
			verification_uri: deviceDetails.verification_uri,
			verification_uri_complete: deviceDetails.verification_uri_complete,
			user_code: deviceDetails.user_code,
			expires_in: deviceDetails.expires_in,
			interval: deviceDetails.interval})
	} catch (error) {
		return res.json("status", "error retreiving data")
	}
	

	return res.json({"status":"some error occurred"})
})

//Route to handle UserCode input
app.get('/mydevice', (req, res) => {
	const user_code = req.query.user_code
	res.render('home', { user_code })

})

app.get('/login', (req, res) => {
	const user_code = req.query.usercode
	res.render('login', { user_code })
})

app.get('/authorization', (req, res) => {
	res.render('authorization')
})

app.post('/verifycredentials', async(req, res) => {
	// console.log(req.body)
	const { username, password } = req.body
	const user = await UserDetails.findOne({ username, password }).lean()
	
	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	return res.json({ status: 'ok', data: user.username, name: user.fullname })
})

app.post('/fetchaccesstoken', async(req, res) => {
	const { username, usercode } = req.body
	const user_details = await UserDetails.findOne({ username }).lean()
	/*console.log("+++++++++")
	console.log(user_details)
	console.log("+++++++++")*/
	const devicedetails = await DeviceDetails.findOne({ user_code: usercode }).lean()
	/*console.log("+++++++++")
	console.log(devicedetails)
	console.log("+++++++++")*/
	var access_token = getTokenWithUid(user_details._id)

	try {
		const response = await TokenDeviceDetails.findOneAndUpdate( { device_code: devicedetails.device_code }, { access_token, status: "OK" } )
	} catch(err) {
		res.json( { "status": "error" })
	}

	return res.json({"status": "ok"})

})

app.post('/cancelauthorization', async(req, res) => {
	const { usercode } = req.body
	const devicedetails = await DeviceDetails.findOne({ user_code: usercode }).lean()
	try {
		const response = await TokenDeviceDetails.findOneAndUpdate( { device_code: devicedetails.device_code }, { status: "access_denied" } )
	} catch(err) {
		res.json( { "status": "error" })
	}

	return res.json({"status": "ok"})
})

app.post('/fetchuserdata', async(req, res) => {
	const uid = getUidFromToken(req.header("Authorization").split(" ")[1])
  	
  	const user = await UserDetails.findOne({ _id:uid }).lean();
    return res.json({
    	"fullname": user.fullname,
    	"mobilenumber": user.mobilenumber,
    	"username": user.username
      	})
})

app.post('/fetchdeviceauthstatus', async(req, res) => {
	const devicecode = req.body.device_code

	const devicedetails = await TokenDeviceDetails.findOne({ device_code: devicecode }).lean()

	return res.json({ "status": devicedetails.status,
	"access_token": devicedetails.access_token })
})

function generateUserCode() {
    var result           = '';
    var characters       = 'BCDFGHJKLMNPQRSTVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < 8; i++ ) {
    	result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function generatedDeviceCode() {
	return crypto.randomBytes(16).toString('hex')
}

// Utility Functions
int_encoder.alphabet()
const ENCRYPTION_KEY = "xyz123";

function encrypt_string(string) {
  var cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY);
  var crypted = cipher.update(string, "utf8", "hex");
  crypted += cipher.final("hex");
  return int_encoder.encode(crypted, 16);
}

function decrypt_string(string) {
  key = int_encoder.decode(string, 16);
  var decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY);
  var dec = decipher.update(key, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

function random(max) {
  return Math.floor(Math.random() * max + 1);
}

function getTokenWithUid(uid) {
  const token = uid + ":" + random(100);
  // console.log("Generated token:" + token);
  const encrypted_token = encrypt_string(token);
  // console.log("uid:" + uid + "  ->  Token:" + encrypted_token);
  return encrypted_token;
}

function getUidFromToken(token) {
  const user_random = decrypt_string(token);
  // console.log("user_random_t: " + user_random);
  const uid = user_random.split(":")[0];
  // console.log("Token:" + token + "  ->  uid:" + uid);
  return uid;
}

function getAuthCodeWithUid(uid) {
  const authcode = uid + "." + random(100);
  //console.log("Generated authocode:" + authcode);
  const encrypted_authcode = encrypt_string(authcode);
  //console.log("uid:" + uid + "  ->  Code:" + encrypted_authcode);
  return encrypted_authcode;
}

function getUidFromAuthCode(authcode) {
  const user_random = decrypt_string(authcode);
  //console.log("user_random_c: " + user_random);
  const uid = user_random.split(".")[0];
  //console.log("Code:" + authcode + "  ->  uid:" + uid);
  return uid;
}

app.listen(5000)