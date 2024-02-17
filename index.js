require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer');
const multer = require('multer');
const User = require("./model/user");
const path = require("path");
const Admin = require("./model/admin");
const PORT = 8080 || process.env.PORT;


mongoose.connect(process.env.DATABASEURL).then(()=>{
    console.log('database connected');
});

app.use(express.json());

const twilioAccountSid = process.env.twilioAccountSid;
const twilioAuthToken = process.env.twilioAuthToken;
const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

function generateOTP(){
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      const uniqueFilename = Date.now() + '-' + file.originalname;
      cb(null, uniqueFilename);
    },
  });
  
  const upload = multer({ storage: storage });



  // A User can register themselves by uploading the required data.
app.post('/user-register',upload.single('image'),async(req,res)=>{
    const { path } = req.file;
    const {name,email,phone,password}  = req.body;
   try {
    const emailFound = await User.findOne({email});
    const phoneFound = await User.findOne({phone});
    if(!isValidEmail(email) ){
        res.status(400).send({
            msg : "Email id is not valid"
        })
      }
    if(emailFound){
        res.status(400).send({
            msg : "Email id already registered"
        })
      }
    if(phone.length < 10 || !["6","7","8","9"].includes(phone[0])){
        res.status(400).send({
            msg : "Phone number is not valid"
        })
    }
    if(phoneFound){
        res.status(400).send({
            msg : "Phone number already registered"
        })
    }
    const hashPass = await bcrypt.hash(password,10);
    const data = await User.create({
            name : name,
            email : email,
            phone : phone,
            password : hashPass,
            image : path
        });
        res.status(200).send({
            msg : "User registered successfully"
        })
    
   } catch (error) {
    res.status(500).send({
        msg : error.msg
    })
   }
})
app.use('/user-register', express.static(path.join(__dirname, 'uploads')));



// A User should verify themselves by putting the correct OTP which is sent to their email and phone.
app.post("/email-verification",async(req,res)=>{
    try {
        const {email, email_otp} = req.body;
    
        const data = await User.findOne({email});
        // console.log("user",data);
        if (!data) {
          return res.status(404).json({ error: 'data not found' });
        }
    
        if (data.email_otp !== email_otp || data.email_otpExpires < new Date()) {
          return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        data.email_verified = true;
        await data.save();
    
        res.status(200).json({ message: 'Email verified successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
});
app.post("/phone-verification",async(req,res)=>{
    try {
        const {phone, phone_otp} = req.body;
    
        const data = await User.findOne({phone});
        // console.log("user",data);
        if (!data) {
          return res.status(404).json({ error: 'data not found' });
        }
    
        if (data.phone_otp !== phone_otp || data.phone_otpExpires < new Date()) {
          return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        data.phone_verified = true;
        await data.save();
    
        res.status(200).json({ message: 'Phone number verified successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
});


// A user can login and they got the OTP on their respected mobile phone and email to verify themselves.
app.post("/user-login",async(req,res)=>{
    const {email, phone, password} = req.body;
    try {
        const data = await User.findOne({email: email,phone : phone});
        const comparePass = await bcrypt.compare(password,data.password)
    
        if(data && comparePass){
            const emailOTP = generateOTP();
            const transporter = nodeMailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'anand882kumar@gmail.com',
                    pass: 'csmy weod mhky pjqt'
                    }
            });
            
            const mailOptions = {
                from: 'anand882kumar@gmail.com',
                to: data.email,
                subject: 'Email Verification',
                text: `Your OTP for email verification is: ${emailOTP}. It is valid up to 5 minutes.`
            };
        
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                return console.error(error);
                }
                console.log('Email sent: ' + info.response);
            });
            const phoneOTP = generateOTP()
            twilio.messages.create({
                body: `Your OTP for phone verification is: ${phoneOTP}. It is valid up to 5 minutes.`,
                from: '+19706144083',
                to: `+91${data.phone}`,
            })
            .then(message => console.log('OTP sent:', message.sid))
            .catch(error => console.error('Error sending OTP:', error));

            data.email_otp = emailOTP;
            data.email_otpExpires = new Date(Date.now() + 5 * 60 * 1000);
            data.phone_otp = phoneOTP;
            data.phone_otpExpires = new Date(Date.now() + 5 * 60 * 1000);
            await data.save();
            res.status(200).send({
                msg : "Please check your mail and phone number to verify you."
            })
        }
    } catch (error) {
        res.status(500).send({
            msg : error.message
        })
    }

});


// Admin can register themselves with this API.
app.post('/admin-register',upload.single('image'),async(req,res)=>{
    const { path } = req.file;
    const {name,email,phone,password}  = req.body;
   try {
    const emailFound = await Admin.findOne({email});
    const phoneFound = await Admin.findOne({phone});
    if(!isValidEmail(email) ){
        res.status(400).send({
            msg : "Email id is not valid"
        })
      }
    if(emailFound){
        res.status(400).send({
            msg : "Email id already registered"
        })
      }
    if(phone.length < 10 || !["6","7","8","9"].includes(phone[0])){
        res.status(400).send({
            msg : "Phone number is not valid"
        })
    }
    if(phoneFound){
        res.status(400).send({
            msg : "Phone number already registered"
        })
    }
    const hashPass = await bcrypt.hash(password,10);
    const data = await Admin.create({
            name : name,
            email : email,
            phone : phone,
            password : hashPass,
            image : path
        });
        res.status(200).send({
            msg : "Admin registered successfully"
        })
    
   } catch (error) {
    res.status(500).send({
        msg : error.msg
    })
   }
});


// Admin can see all users data by login there account.
app.get("/admin-login",async(req,res)=>{
    const { phone, password } = req.body;
    console.log(password);
    try {
        if(phone.length < 10 || !["6","7","8","9"].includes(phone[0])){
            res.status(400).send({
                msg : "Phone number is not valid"
            })
        }
        const data = await Admin.findOne({phone});
        console.log(data);
        const comparePass = await bcrypt.compare(password,data.password);
        if(data && comparePass){
            const allUser = await User.find();
            res.status(200).send({
                msg : "All user data",
                data : allUser
            })
        }else{
            res.status(400).send({
                msg : "You are not authorized"
            })
        }
    } catch (error) {
        res.status(500).send({
            msg : error.message
        })
    }
})
app.listen(PORT,()=>{
    console.log(`app is listening at this PORT ${PORT}`);
})