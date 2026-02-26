const mongoose = require ("mongoose");
const User = require ("../models/user")
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const transporter = require ("../config/nodemailer")

exports.register  = async (req , res) => {
       const { name , email , password } = req.body;
       if(!name || !email || !password){
        return res.status(400).json({success: false, message : "Please enter all fields"})
       }
       try {
             // Normalize email to lowercase for case-insensitive comparison
             const normalizedEmail = email.toLowerCase().trim();
             
             const userExits = await User.findOne({email: normalizedEmail})
             if(userExits){
                return res.status(400).json({success: false, message : "User already exists"})
             }
             const hashedPassword = await bcrypt.hash(password, 10);

             const user = new User ({
                name,   
                email: normalizedEmail,
                password : hashedPassword
             });
                await user.save();


                const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

                res.cookie ("token", token , {
                    httpOnly : true,
                    secure : process.env.NODE_ENV === 'production',
                    sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
                    maxAge : 7 * 24 * 60 * 60 * 1000

                });
         
                const mailOptions = {
                    from : process.env.EMAIL_USER,
                    to : user.email,
                    subject : "Welcome to MERN_AUTH",
                    text : `Hi ${user.name},\n\nThank you for registering on our app! We're excited to have you on board.\n\nBest regards,\nThe Team`

                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log("Welcome email sent successfully");
                } catch (emailError) {
                    console.error("Email sending failed:", emailError.message);
                }

                return res.json({success : true});


        
       } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({success : false , message : "User already exists"})
        }
        return res.status(500).json({success : false , message : error.message})
       }

}

exports.login = async (req , res ) => {
    const { email , password } = req.body;
    if(!email || !password){
        return res.status(400).json({success: false, message : "Please enter all fields"})
    }
    try {
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            console.log("User not found with email:", email);
            return res.status(400).json({success: false, message : "Invalid credentials - User not found"})
        }
        const isMatch = await bcrypt.compare(password , user.password); 

        if(!isMatch){
            console.log("Password mismatch for user:", email);
            return res.status(400).json({success: false, message : "Invalid credentials - Wrong password"})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});
                res.cookie ("token", token , {
                    httpOnly : true,
                    secure : process.env.NODE_ENV === 'production',
                    sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
                    maxAge : 7 * 24 * 60 * 60 * 1000

                });

                return res.json({success : true});


        
    } catch (error) {
         return res.json({success : false , message : error.message})
    }
};


exports.logout = async (req , res) => {
    try{
        res.clearCookie("token", {
                httpOnly : true,
                secure : process.env.NODE_ENV === 'production',
                sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
          })

          return res.json({success : true , message : "Logged out successfully"})
} 
catch (error) {
    return res.json({success : false , message : error.message})
}

};

exports.sendVerifyOtp = async (req , res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if(user.isAccountVerified){
            return res.status(400).json({success: false, message : "Account already verified"})
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();
        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            subject : "Account Verification OTP",
            text : `Hi ${user.name},\n\nYour OTP for account verification is: ${otp}. It will expire in 10 minutes.\n\nBest regards,\nThe Team`

        };

        await transporter.sendMail(mailOptions);
        return res.json({success : true , message : "OTP sent to your email"})  
        
    } catch (error) {
        res.json({success : false , message : "Something went wrong"})
    }

};

exports.verifyEmail = async (req , res) => {
    const userId = req.userId;
    const {otp} = req.body;
    if(!otp){
        return res.status(400).json({success: false, message : "Please enter OTP"})
    }

    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(400).json({success: false, message : "Invalid user"})
        }
        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.status(400).json({success: false, message : "Invalid OTP"})
        }

        if(user.verifyOtpExpireAt < Date.now()){
            return res.status(400).json({success: false, message : "OTP expired"})
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({success : true , message : "Email verified successfully"})
        
    } catch (error) {
        res.status(500).json({success : false , message : "Something went wrong"})
        
    }
};

exports.isAuthenticated = async (req, res) => {
    try {
          return res.json({success: true});
        // const userId = req.userId;
        // const user = await User.findById(userId).select("-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt");
    }
    catch (error) {
        res.json({success : false , message : "Something went wrong"})
    }
};

exports.sendResetOtp = async (req, res) => {
    const {email} = req.body;
    if(!email){
        return res.status(400).json({success: false, message : "Please enter email"})
    }
    try {
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            return res.status(400).json({success: false, message : "Invalid email"})
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            subject : "Password Reset OTP",
            text : `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}. It will expire in 10 minutes.\n\nBest regards,\nThe Team`
        };
        await transporter.sendMail(mailOptions);
        return res.json({success : true , message : "OTP sent to your email"})



    }
    catch (error){
        res.json({success : false , message : "Something went wrong"})
    }
};

exports.resetPassword = async (req , res) => {
    const {email , otp , newPassword} = req.body;
    if(!email || !otp || !newPassword){
        return res.status(400).json({success: false, message : "Please enter all fields"})
    }
    try {
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: normalizedEmail})
        if(!user){
            return res.status(400).json({success: false, message : "Invalid email"})
        }
        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.status(400).json({success: false, message : "Invalid OTP"})
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.status(400).json({success: false, message : "OTP expired"})
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();
        return res.json({success : true , message : "Password reset successfully"})

    }
    catch (error){
        res.json({success : false , message : "Something went wrong"})
    }
};

