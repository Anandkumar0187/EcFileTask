const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name : String,
    email : {type : String, unique : true},
    phone : {type : String, unique : true},
    password : String,
    image: String
})

const Admin = mongoose.model('Admin',adminSchema);

module.exports = Admin;
