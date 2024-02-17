const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : String,
    email : {type : String, unique : true},
    phone : {type : String, unique : true},
    password : String,
    image: String,
    email_otp: String,
    email_otpExpires: Date,
    phone_otp : String,
    phone_otpExpires : Date,
    email_verified : {type : String, default : false},
    phone_verified : {type : String, default : false}
})

const User = mongoose.model('User',userSchema);

module.exports = User;
