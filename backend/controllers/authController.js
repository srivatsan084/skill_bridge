const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

/**
 * Helper to determine cookie security and SameSite configuration
 * Defaults to lax + non-secure for local HTTP (including Docker Compose on localhost:3000)
 * Allows secure + none when explicitly configured for HTTPS production
 */
const getCookieOptions = (expiresInMs = 7 * 24 * 60 * 60 * 1000) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieSecure =
    process.env.COOKIE_SECURE === 'true' ||
    (isProduction && process.env.COOKIE_SECURE !== 'false' && process.env.USE_HTTPS === 'true');
  const cookieSameSite = process.env.COOKIE_SAMESITE || (cookieSecure ? 'none' : 'lax');

  return {
    expires: new Date(Date.now() + expiresInMs),
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: '/'
  };
};

/**
 * Generate JWT and send via HttpOnly Cookie
 */
const sendTokenResponse = (student, statusCode, res, message = '') => {
  const token = jwt.sign(
    { id: student._id },
    process.env.JWT_SECRET || 'skillbridge_dev_secret',
    { expiresIn: '7d' }
  );

  const cookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      student
    });
};

/**
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      college,
      degree,
      branch,
      academicYear,
      semester,
      graduationYear,
      targetRole
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student account with this email already exists. Please log in.'
      });
    }

    const student = await Student.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college || '',
      degree: degree || 'B.Tech',
      branch: branch || '',
      academicYear: academicYear || 'First Year',
      semester: semester || 'Semester 1',
      graduationYear: graduationYear || new Date().getFullYear() + 4,
      targetRole: targetRole || 'Full Stack Developer',
      isOnboarded: false
    });

    sendTokenResponse(student, 201, res, 'Student registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in student
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find student
    const student = await Student.findOne({ email: email.toLowerCase().trim() });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password
    const isMatch = await student.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    sendTokenResponse(student, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out student and clear HttpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', getCookieOptions(5 * 1000));

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in student profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
