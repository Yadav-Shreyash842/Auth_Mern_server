const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');
const { getWelcomeEmail, getVerificationOtpEmail, getPasswordResetOtpEmail } = require('../utils/emailTemplates');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter all fields' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const user = new User({
            name,
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, cookieOptions);

        // Send welcome email — non-blocking, don't fail registration if email fails
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            ...getWelcomeEmail(user.name)
        }).catch(() => {});

        return res.json({ success: true });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter all fields' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, cookieOptions);

        return res.json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('token', cookieOptions);
        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.sendVerifyOtp = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            ...getVerificationOtpEmail(otp)
        });

        return res.json({ success: true, message: 'OTP sent to email' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP. Check email settings on server.' });
    }
};

exports.verifyEmail = async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ success: false, message: 'Please enter OTP' });
    }

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid user' });
        }

        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Email verified successfully' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.isAuthenticated = async (req, res) => {
    return res.json({ success: true });
};

exports.sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Please enter email' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Email not registered' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            ...getPasswordResetOtpEmail(otp)
        });

        return res.json({ success: true, message: 'OTP sent to email' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP. Check email settings on server.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please enter all fields' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email' });
        }

        if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};
