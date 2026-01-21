const jwt = require('jsonwebtoken');
const { hasPermission } = require('./roles');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware để xác thực JWT token
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '❌ No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '❌ Invalid or expired token',
      error: error.message
    });
  }
};

// Middleware để kiểm tra role
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '❌ No user found'
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied. Insufficient role'
      });
    }

    next();
  };
};

// Middleware để kiểm tra permission
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '❌ No user found'
      });
    }

    if (!hasPermission(req.user.role, requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `❌ Access denied. Missing permission: ${requiredPermission}`
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  permissionMiddleware
};
