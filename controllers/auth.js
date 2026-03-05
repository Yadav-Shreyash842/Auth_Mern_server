const mongoose = require ("mongoose");
const User = require ("../models/user")
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const transporter = require ("../config/nodemailer")

exports.register  = async (req , res) => {
       const { name , email , password } = req.body;
       
       // Validate all fields
       if(!name || !email || !password){
        console.log('[REGISTER] Missing fields:', { hasName: !!name, hasEmail: !!email, hasPassword: !!password });
        return res.status(400).json({success: false, message : "Please enter all fields"})
       }
       
       // Validate email format
       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!emailRegex.test(email)) {
           console.log('[REGISTER] Invalid email format:', email);
           return res.status(400).json({success: false, message : "Please enter a valid email address"})
       }
       
       // Validate password length
       if (password.length < 6) {
           console.log('[REGISTER] Password too short');
           return res.status(400).json({success: false, message : "Password must be at least 6 characters long"})
       }
       
       try {
             // Normalize email to lowercase for case-insensitive comparison
             const normalizedEmail = email.toLowerCase().trim();
             
             console.log(`[REGISTER] Registration attempt for email: ${normalizedEmail}`);
             
             // Check if user already exists
             const userExists = await User.findOne({email: normalizedEmail})
             if(userExists){
                console.log(`[REGISTER] Registration failed: User with email ${normalizedEmail} already exists`);
                return res.status(400).json({success: false, message : "User already exists with this email"})
             }
             
             console.log(`[REGISTER] Creating new user: ${normalizedEmail}`);
             const hashedPassword = await bcrypt.hash(password, 10);

             const user = new User ({
                name,   
                email: normalizedEmail,
                password : hashedPassword
             });
             await user.save();
             console.log(`[REGISTER] User saved successfully: ${normalizedEmail}, ID: ${user._id}`);

             const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

             res.cookie ("token", token , {
                 httpOnly : true,
                 secure : process.env.NODE_ENV === 'production',
                 sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
                 maxAge : 7 * 24 * 60 * 60 * 1000
             });
         
             // Send welcome email (don't block registration if email fails)
             const mailOptions = {
                 from : process.env.EMAIL_USER,
                 to : user.email,
                 subject : "Welcome to MERN_AUTH",
                 text : `Hi ${user.name},\n\nThank you for registering on our app! We're excited to have you on board.\n\nBest regards,\nThe Team`
             };

             try {
                 const info = await transporter.sendMail(mailOptions);
                 console.log(`[REGISTER] Welcome email sent successfully to ${user.email}. Message ID:`, info.messageId);
             } catch (emailError) {
                 console.error("[REGISTER] Email sending failed:", emailError.message);
                 console.error("[REGISTER] Email error details:", emailError);
             }

             console.log(`[REGISTER] Registration completed successfully: ${normalizedEmail}`);
             return res.json({success : true});

        
       } catch (error) {
        console.error('[REGISTER] Registration error:', error.message);
        console.error('[REGISTER] Error code:', error.code);
        console.error('[REGISTER] Full error:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({success : false , message : "Email already registered"})
        }
        return res.status(500).json({success : false , message : "Something went wrong. Please try again"})
       }

}

exports.login = async (req , res ) => {
    const { email , password } = req.body;
    
    // Validate input
    if(!email || !password){
        console.log('[LOGIN] Missing fields:', { hasEmail: !!email, hasPassword: !!password });
        return res.status(400).json({success: false, message : "Please enter all fields"})
    }
    
    try {
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[LOGIN] Login attempt for email: ${normalizedEmail}`);
        
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            console.log(`[LOGIN] User not found with email: ${normalizedEmail}`);
            return res.status(400).json({success: false, message : "Invalid email or password"})
        }
        
        const isMatch = await bcrypt.compare(password , user.password); 

        if(!isMatch){
            console.log(`[LOGIN] Password mismatch for user: ${normalizedEmail}`);
            return res.status(400).json({success: false, message : "Invalid email or password"})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});
        res.cookie ("token", token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        console.log(`[LOGIN] Login successful for: ${normalizedEmail}`);
        return res.json({success : true});
        
    } catch (error) {
        console.error('[LOGIN] Login error:', error.message);
        console.error('[LOGIN] Full error:', error);
        return res.status(500).json({success : false , message : "Login failed. Please try again"})
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
        console.log('[VERIFY OTP] Sending OTP for user:', userId);
        
        const user = await User.findById(userId);
        if(!user){
            console.log('[VERIFY OTP] User not found:', userId);
            return res.status(400).json({success: false, message : "User not found"})
        }
        
        if(user.isAccountVerified){
            console.log('[VERIFY OTP] Account already verified:', user.email);
            return res.status(400).json({success: false, message : "Account already verified"})
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();
        console.log('[VERIFY OTP] OTP saved for user:', user.email);
        
        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            subject : "Account Verification OTP",
            text : `Hi ${user.name},\n\nYour OTP for account verification is: ${otp}. It will expire in 10 minutes.\n\nBest regards,\nThe Team`
        };

        console.log('[VERIFY OTP] Sending email to:', user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log('[VERIFY OTP] Email sent successfully. Message ID:', info.messageId);
        
        return res.json({success : true , message : "OTP sent to your email"})  
        
    } catch (error) {
        console.error('[VERIFY OTP] Error:', error.message);
        console.error('[VERIFY OTP] Full error:', error);
        res.status(500).json({success : false , message : "Failed to send OTP. Please try again"})
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
        console.log('[RESET OTP] Sending password reset OTP to:', normalizedEmail);
        
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            console.log('[RESET OTP] User not found:', normalizedEmail);
            return res.status(400).json({success: false, message : "Email not registered"})
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();
        console.log('[RESET OTP] OTP saved for user:', user.email);

        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            subject : "Password Reset OTP",
            text : `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}. It will expire in 10 minutes.\n\nBest regards,\nThe Team`
        };
        
        console.log('[RESET OTP] Sending email to:', user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log('[RESET OTP] Email sent successfully. Message ID:', info.messageId);
        
        return res.json({success : true , message : "OTP sent to your email"})

    }
    catch (error){
        console.error('[RESET OTP] Error:', error.message);
        console.error('[RESET OTP] Full error:', error);
        res.status(500).json({success : false , message : "Failed to send OTP. Please try again"})
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

