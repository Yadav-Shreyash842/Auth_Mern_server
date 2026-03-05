const User = require ("../models/user")
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const transporter = require ("../config/nodemailer")
const { getWelcomeEmail, getVerificationOtpEmail, getPasswordResetOtpEmail } = require("../utils/emailTemplates")

exports.register  = async (req , res) => {
       const { name , email , password } = req.body;
       
       console.log('📝 [REGISTER] Registration attempt:', { name, email });
       
       if(!name || !email || !password){
        console.log('❌ [REGISTER] Missing fields');
        return res.status(400).json({success: false, message : "Please enter all fields"})
       }
       try {

             const normalizedEmail = email.toLowerCase().trim();
             console.log('🔍 [REGISTER] Checking for existing user:', normalizedEmail);

             const userExists = await User.findOne({email: normalizedEmail})
             if(userExists){
                console.log('⚠️ [REGISTER] User already exists:', normalizedEmail);
                return res.status(400).json({success: false, message : "User already exists with this email"})
             }
             
             console.log('🔐 [REGISTER] Hashing password...');
             const hashedPassword = await bcrypt.hash(password, 10);

             const user = new User ({
                name,   
                email: normalizedEmail,
                password : hashedPassword
             });
             
             console.log('💾 [REGISTER] Saving user to database...');
             await user.save();
             console.log('✅ [REGISTER] User saved successfully:', user._id);

             const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

             res.cookie ("token", token , {
                 httpOnly : true,
                 secure : process.env.NODE_ENV === 'production',
                 sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
                 maxAge : 7 * 24 * 60 * 60 * 1000
             });
             
             console.log('🍪 [REGISTER] Token cookie set');

             const emailTemplate = getWelcomeEmail(user.name);
             const mailOptions = {
                 from : process.env.EMAIL_USER,
                 to : user.email,
                 ...emailTemplate
             };

             try {
                 console.log('📧 [REGISTER] Sending welcome email to:', user.email);
                 const info = await transporter.sendMail(mailOptions);
                 console.log('✅ [REGISTER] Welcome email sent. Message ID:', info.messageId);
             } catch (emailError) {
                 console.error('⚠️ [REGISTER] Email failed (non-critical):', emailError.message);
             }
             
             console.log('🎉 [REGISTER] Registration complete!');
             return res.json({success : true});

       } catch (error) {
        console.error('❌ [REGISTER] Error:', error.message);
        console.error('Error code:', error.code);
        
        if (error.code === 11000) {
            return res.status(400).json({success : false , message : "Email already registered"})
        }

        return res.status(500).json({success : false , message : "Something went wrong"})
       }
}

exports.login = async (req , res ) => {

    const { email , password } = req.body;

    if(!email || !password){
        return res.status(400).json({success: false, message : "Please enter all fields"})
    }

    try {

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({email: normalizedEmail});

        if(!user){
            return res.status(400).json({success: false, message : "Invalid credentials"})
        }

        const isMatch = await bcrypt.compare(password , user.password); 

        if(!isMatch){
            return res.status(400).json({success: false, message : "Invalid credentials"})
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
        console.log('📧 [VERIFY OTP] Request from user ID:', userId);

        const user = await User.findById(userId);

        if(!user){
            console.log('❌ [VERIFY OTP] User not found:', userId);
            return res.status(400).json({success: false, message : "User not found"})
        }
        
        console.log('👤 [VERIFY OTP] User found:', user.email);

        if(user.isAccountVerified){
            console.log('⚠️ [VERIFY OTP] Account already verified:', user.email);
            return res.status(400).json({success: false, message : "Account already verified"})
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔢 [VERIFY OTP] Generated OTP:', otp, 'for', user.email);

        user.verifyOtp = otp;

        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;

        await user.save();
        console.log('💾 [VERIFY OTP] OTP saved to database');

        const emailTemplate = getVerificationOtpEmail(otp);
        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            ...emailTemplate
        };
        
        console.log('📧 [VERIFY OTP] Sending email to:', user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [VERIFY OTP] Email sent successfully! Message ID:', info.messageId);

        return res.json({success : true , message : "OTP sent to email"})  

    } catch (error) {
        console.error('❌ [VERIFY OTP] Error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({success : false , message : "Failed to send OTP"})

    }

};


exports.verifyEmail = async (req , res) => {

    const userId = req.userId;

    const {otp} = req.body;
    
    console.log('✅ [VERIFY EMAIL] Verification attempt for user:', userId, 'with OTP:', otp);

    if(!otp){
        console.log('❌ [VERIFY EMAIL] No OTP provided');
        return res.status(400).json({success: false, message : "Please enter OTP"})
    }

    try {

        const user = await User.findById(userId);

        if(!user){
            console.log('❌ [VERIFY EMAIL] User not found:', userId);
            return res.status(400).json({success: false, message : "Invalid user"})
        }
        
        console.log('👤 [VERIFY EMAIL] User found:', user.email, 'Stored OTP:', user.verifyOtp);

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            console.log('❌ [VERIFY EMAIL] Invalid OTP. Expected:', user.verifyOtp, 'Received:', otp);
            return res.status(400).json({success: false, message : "Invalid OTP"})
        }

        if(user.verifyOtpExpireAt < Date.now()){
            console.log('❌ [VERIFY EMAIL] OTP expired');
            return res.status(400).json({success: false, message : "OTP expired"})
        }

        user.isAccountVerified = true;

        user.verifyOtp = '';

        user.verifyOtpExpireAt = 0;

        await user.save();
        
        console.log('🎉 [VERIFY EMAIL] Email verified successfully for:', user.email);

        return res.json({success : true , message : "Email verified successfully"})

    } catch (error) {
        console.error('❌ [VERIFY EMAIL] Error:', error.message);
        res.status(500).json({success : false , message : "Something went wrong"})

    }
};


exports.isAuthenticated = async (req, res) => {

    try {

        return res.json({success: true});

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

        const normalizedEmail = email.toLowerCase().trim();
        console.log('🔑 [RESET OTP] Password reset request for:', normalizedEmail);

        const user = await User.findOne({email: normalizedEmail});

        if(!user){
            console.log('❌ [RESET OTP] User not found:', normalizedEmail);
            return res.status(400).json({success: false, message : "Email not registered"})
        }
        
        console.log('👤 [RESET OTP] User found:', user.email);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔢 [RESET OTP] Generated OTP:', otp);

        user.resetOtp = otp;

        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;

        await user.save();
        console.log('💾 [RESET OTP] OTP saved to database');

        const emailTemplate = getPasswordResetOtpEmail(otp);
        const mailOptions = {
            from : process.env.EMAIL_USER,
            to : user.email,
            ...emailTemplate
        };
        
        console.log('📧 [RESET OTP] Sending email to:', user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [RESET OTP] Email sent successfully! Message ID:', info.messageId);

        return res.json({success : true , message : "OTP sent to email"})

    }

    catch (error){
        console.error('❌ [RESET OTP] Error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({success : false , message : "Failed to send OTP"})

    }

};


exports.resetPassword = async (req , res) => {

    const {email , otp , newPassword} = req.body;
    
    console.log('🔐 [RESET PASSWORD] Request received:', { email, otp, newPasswordLength: newPassword?.length });

    if(!email || !otp || !newPassword){
        console.log('❌ [RESET PASSWORD] Missing fields');
        return res.status(400).json({success: false, message : "Please enter all fields"})
    }

    try {

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedOtp = otp.toString().trim();
        
        console.log('🔍 [RESET PASSWORD] Looking up user:', normalizedEmail);

        const user = await User.findOne({email: normalizedEmail})

        if(!user){
            console.log('❌ [RESET PASSWORD] User not found');
            return res.status(400).json({success: false, message : "Invalid email"})
        }
        
        console.log('👤 [RESET PASSWORD] User found:', user.email);
        console.log('🔢 [RESET PASSWORD] Stored OTP:', user.resetOtp);
        console.log('🔢 [RESET PASSWORD] Received OTP:', normalizedOtp);
        console.log('⏰ [RESET PASSWORD] OTP expires at:', new Date(user.resetOtpExpireAt));
        console.log('⏰ [RESET PASSWORD] Current time:', new Date());

        if(user.resetOtp === '' || user.resetOtp !== normalizedOtp){
            console.log('❌ [RESET PASSWORD] OTP mismatch!');
            return res.status(400).json({success: false, message : "Invalid OTP"})
        }

        if(user.resetOtpExpireAt < Date.now()){
            console.log('❌ [RESET PASSWORD] OTP expired');
            return res.status(400).json({success: false, message : "OTP expired"})
        }
        
        console.log('✅ [RESET PASSWORD] OTP verified, updating password');

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        user.resetOtp = '';

        user.resetOtpExpireAt = 0;

        await user.save();
        
        console.log('✅ [RESET PASSWORD] Password updated successfully');

        return res.json({success : true , message : "Password reset successfully"})

    }

    catch (error){
        console.error('❌ [RESET PASSWORD] Error:', error.message);
        res.json({success : false , message : "Something went wrong"})

    }

};