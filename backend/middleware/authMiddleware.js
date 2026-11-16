const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  let token;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization Header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.'
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration: JWT_SECRET is not set.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id).select('-password');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'The student account associated with this session no longer exists.'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session has expired or token is invalid. Please log in again.'
    });
  }
};

module.exports = { protect };
