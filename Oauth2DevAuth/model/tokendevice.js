const mongoose = require('mongoose');

const TokenDeviceSchema = new mongoose.Schema(
    {
        device_code: {type: String, required: true},
        access_token: {type: String, default: ""},
        status: {type: String, required: true, default: "authorization_pending"}
    }, 
    { collection: 'tokendevicedetails'}
)

const model = mongoose.model('TokenDeviceSchema', TokenDeviceSchema)

module.exports = model