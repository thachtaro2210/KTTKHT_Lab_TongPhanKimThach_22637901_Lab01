const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

class JWTManager {
  // Tạo token từ user data
  generateToken(userData) {
    try {
      const token = jwt.sign(userData, JWT_SECRET, {
        expiresIn: '24h' // Token hết hạn sau 24 giờ
      });
      console.log('✅ Token generated successfully');
      return token;
    } catch (error) {
      console.error('❌ Error generating token:', error.message);
      return null;
    }
  }

  // Verify token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified successfully');
      return decoded;
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return null;
    }
  }

  // Decode token (không verify)
  decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error.message);
      return null;
    }
  }
}

module.exports = new JWTManager();
