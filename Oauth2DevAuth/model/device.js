const mongoose = require('mongoose');

/*{
  "device_code": "NGU4QWFiNjQ5YmQwNG3YTdmZMEyNzQ3YzQ1YSA",
  "verification_uri": "https://example.com/device",
  "user_code": "BDSD-HQMK",
  "expires_in": 1800,
  "interval": 5
}
*/

const DeviceSchema = new mongoose.Schema(
    {
        device_code: {type: String, required: true},
        verification_uri: {type: String, default: "http://a00c-2405-201-a416-d981-7c71-12c2-aec9-8bd3.ngrok.io"},
        verification_uri_complete: {type: String},
        user_code: {type: String, required: true},
        expires_in: {type: String, default: "1800"},
        interval: {type: String, default: "5"}
    }, 
    { collection: 'devicedetails'}
)

DeviceSchema.index({device_code: 1, user_code: 1}, {unique: true})

const model = mongoose.model('DeviceSchema', DeviceSchema)

module.exports = model