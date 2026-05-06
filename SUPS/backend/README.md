# SUPS Backend Setup Guide

## Prerequisites
- Node.js installed (download from https://nodejs.org/)
- A Gmail account (or other email service)

## Installation & Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Email Settings

#### For Gmail:
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer" (or your OS)
5. Copy the generated 16-character password

#### Create .env File:
Copy `.env.example` to `.env` and fill in your credentials:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
PORT=5000
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_FROM=noreply@sups.com
```

### Step 4: Start the Backend Server
```bash
npm start
```

You should see:
```
SUPS Backend server running on http://localhost:5000
```

## How Email Verification Works

1. **User Signs Up**
   - Enters name, email, password
   - Backend generates 6-digit code
   - Verification email is sent to user's email address

2. **User Verifies Email**
   - User receives email with code
   - User enters code on verification page
   - Backend validates code
   - Account is successfully created

3. **User Logs In**
   - Only verified accounts can log in
   - Backend checks email and password
   - Returns user info on success

## Testing Locally

1. Start the backend: `npm start`
2. Open `index.html` in your browser
3. Click "Sign Up"
4. Enter details and check your email for verification code
5. Enter the code to complete registration

## Production Deployment Notes

For production, you should:
- Replace in-memory storage with a real database (MongoDB, PostgreSQL, etc.)
- Use environment variables for sensitive data
- Implement password hashing (bcrypt is already installed)
- Add rate limiting for signup/login
- Use HTTPS
- Deploy to a service like Heroku, AWS, or DigitalOcean

## Troubleshooting

**"Network error" when signing up?**
- Make sure backend is running on http://localhost:5000
- Check browser console for detailed errors (F12)

**Email not being sent?**
- Verify your .env file has correct credentials
- Check LESS SECURE APPS setting for Gmail
- Check spam folder

**CORS errors?**
- Backend has CORS enabled for development
- Cross-origin requests from your HTML files should work

## Support

For issues or questions, refer to:
- Express.js: https://expressjs.com/
- Nodemailer: https://nodemailer.com/
- Node.js: https://nodejs.org/
