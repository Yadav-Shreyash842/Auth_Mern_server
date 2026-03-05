// Professional HTML email templates

exports.getWelcomeEmail = (userName) => {
    return {
        subject: "Welcome to MERN Auth!",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to MERN Auth!</h1>
                </div>
                <div class="content">
                    <h2>Hi ${userName}! 👋</h2>
                    <p>Thank you for creating an account with us. We're excited to have you on board!</p>
                    <p>Your account has been successfully created. You can now:</p>
                    <ul>
                        <li>✅ Access your personalized dashboard</li>
                        <li>✅ Verify your email for enhanced security</li>
                        <li>✅ Manage your account settings</li>
                    </ul>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} MERN Auth. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };
};

exports.getVerificationOtpEmail = (otp) => {
    return {
        subject: "Email Verification OTP",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                .otp { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Verify Your Email</h1>
                </div>
                <div class="content">
                    <p>Hi there! 👋</p>
                    <p>You requested to verify your email address. Please use the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                        <div class="otp">${otp}</div>
                        <p style="margin: 0; color: #666; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Note:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
                    </div>
                    
                    <p>If you didn't request this verification, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} MERN Auth. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };
};

exports.getPasswordResetOtpEmail = (otp) => {
    return {
        subject: "Password Reset OTP",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                .otp { font-size: 36px; font-weight: bold; color: #f5576c; letter-spacing: 8px; }
                .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔑 Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hi there! 👋</p>
                    <p>You requested to reset your password. Please use the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                        <div class="otp">${otp}</div>
                        <p style="margin: 0; color: #666; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
                    </div>
                    
                    <p><strong>Important:</strong> Never share this OTP with anyone, including our support team.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} MERN Auth. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };
};
