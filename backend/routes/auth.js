const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/emailConfig');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Password Validation Helper
const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
  return regex.test(password);
};

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined.');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ msg: 'Password must be 8-12 characters long and include uppercase, lowercase, number, and special character.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user = new User({
      username,
      email,
      password,
      otp,
      otpExpire
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your SpendSmart Account',
        message: `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">SpendSmart Account Verification</h2>
            <p>Hello <strong>${user.username}</strong>,</p>
            <p>Thank you for signing up for SpendSmart! Please use the following One-Time Password (OTP) to verify your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
            </div>
            <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      res.json({ msg: 'OTP sent to email. Please verify.' });
    } catch (err) {
      console.error('Email Send Error:', err);
      // In a real app, you might want to delete the user or provide a resend option
      res.json({ msg: 'OTP sent to email. Please verify.' });
    }
  } catch (err) {
    console.error('Registration Error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ msg: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    }
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined.');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
      }
    );
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and log in automatically
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user || user.isVerified || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Verification failed' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User with this email does not exist' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
        html: `<p>You are receiving this email because you requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`
      });
      res.json({ msg: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/reset-password/:token
// @desc    Reset password using token
router.put('/reset-password/:token', async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    let user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

    if (!validatePassword(req.body.password)) {
      return res.status(400).json({ msg: 'Invalid password requirement' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/change-password
// @desc    Change password for logged in user
router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    let user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect old password' });

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ msg: 'Invalid password requirement' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/google
// @desc    Google Sign-In / Sign-Up
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = new User({
        username: name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
        isVerified: true // Google accounts are auto-verified
      });
      await user.save();
    }

    const jwtPayload = { user: { id: user.id } };
    jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ msg: 'Google authentication failed' });
  }
});

// @route   DELETE api/auth/profile
// @desc    Delete user account and all expenses
router.delete('/profile', auth, async (req, res) => {
  try {
    // Delete all expenses of the user
    await Expense.deleteMany({ user: req.user.id });
    
    // Delete the user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ msg: 'User account and all data deleted permanently' });
  } catch (err) {
    console.error('Delete Profile Error:', err);
    res.status(500).json({ msg: 'Server error during account deletion' });
  }
});

module.exports = router;
