const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailConfig');
const crypto = require('crypto');

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
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">&copy; 2026 SpendSmart. Safe & Secure Spending.</p>
          </div>
        `
      });
      res.json({ msg: 'OTP sent to email. Please verify.' });
    } catch (err) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      console.error('Email Send Error:', err);
      return res.status(500).json({ msg: 'Email could not be sent' });
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

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Account not verified. Please verify your email first.' });
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
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account already verified' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Log the user in automatically after verification
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
        res.json({ 
          token, 
          user: { id: user.id, username: user.username, email: user.email },
          msg: 'Verification successful!'
        });
      }
    );
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ msg: 'Server error during verification' });
  }
});

// @route   POST api/auth/resend-otp
// @desc    Resend verification OTP
// @access  Public
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Verification OTP (Resent)',
      message: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Resent Account Verification</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>You requested to resend your One-Time Password (OTP) for SpendSmart. Please use the following code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ msg: 'New OTP sent to email.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ msg: 'Email could not be sent' });
  }
});

module.exports = router;
