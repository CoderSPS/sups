const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with database in production)
const users = [];
const verificationCodes = {};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Utility function to generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility function to send verification email
async function sendVerificationEmail(email, code) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'SUPS - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #070707;">Welcome to SUPS!</h2>
          <p style="font-size: 16px; color: #333;">Your email verification code is:</p>
          <div style="background-color: #8fd4ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #070707; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you didn't sign up for SUPS, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">© 2026 SUPS. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Sign Up Endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store temporary signup data
    verificationCodes[email] = {
      code: verificationCode,
      userData: { name, email, password },
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({ 
      message: 'Verification code sent to your email',
      email: email 
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Verify Email Endpoint
app.post('/api/verify-email', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check if verification code exists and is valid
    if (!verificationCodes[email]) {
      return res.status(400).json({ error: 'No verification request found for this email' });
    }

    const verificationData = verificationCodes[email];

    // Check if code has expired
    if (Date.now() > verificationData.expiresAt) {
      delete verificationCodes[email];
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check if code matches
    if (verificationData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid, save user
    const userData = verificationData.userData;
    users.push({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      verified: true,
      createdAt: new Date()
    });

    // Clean up verification code
    delete verificationCodes[email];

    res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        name: userData.name,
        email: userData.email
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// Resend Code Endpoint
app.post('/api/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!verificationCodes[email]) {
      return res.status(400).json({ error: 'No verification request found for this email' });
    }

    // Generate new verification code
    const newCode = generateVerificationCode();
    verificationCodes[email].code = newCode;
    verificationCodes[email].createdAt = Date.now();
    verificationCodes[email].expiresAt = Date.now() + 10 * 60 * 1000;

    // Send new verification email
    const emailSent = await sendVerificationEmail(email, newCode);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({ message: 'New verification code sent to your email' });

  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Server error while resending code' });
  }
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.verified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    res.status(200).json({ 
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SUPS Backend server running on http://localhost:${PORT}`);
  console.log(`Make sure to set up your .env file with email credentials`);
});
