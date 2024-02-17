const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : String,
    email : {type : String, unique : true},
    phone : {type : String, unique : true},
    password : String,
    image: String,
    otp: String,
    otpExpires: Date,
    verified : {type : String, default : false}
})

const User = mongoose.model('User',userSchema);

module.exports = User;
