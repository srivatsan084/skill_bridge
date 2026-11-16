const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
dotenv.config();

// Validate critical environment variables at startup
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'MONGODB_URI'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[SkillBridge Server] FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('[SkillBridge Server] Please configure these in backend/.env before starting the server.');
  process.exit(1);
}

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const industryRoutes = require('./routes/industryRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Secure HTTP Headers
app.use(helmet());

// Global Rate Limiting (DDoS and abuse prevention)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Strict Rate Limiting for Auth endpoints (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SkillBridge Backend API is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/industry', industryRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('[SkillBridge Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SkillBridge Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep stdin active to prevent premature exit in background task runners
if (process.stdin.isTTY === false) {
  process.stdin.resume();
}

const server = app.listen(PORT, () => {
  console.log(`[SkillBridge Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
