const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        fullname: {type: String},
        mobilenumber: {type: String}
    }, 
    { collection: 'userdetails'}
)

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model