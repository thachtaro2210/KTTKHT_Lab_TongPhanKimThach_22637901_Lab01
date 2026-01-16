const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret_key';

// Store refresh tokens (in production, use Redis or DB)
const refreshTokenStore = new Map();

class JWTManager {
  
  // ==================== ACCESS TOKEN ====================
  
  // Tạo Access Token (short-lived: 15 minutes)
  generateAccessToken(userData) {
    try {
      const token = jwt.sign(userData, JWT_SECRET, {
        expiresIn: '15m' // Access token expire sau 15 phút
      });
      console.log('✅ Access Token generated successfully');
      return token;
    } catch (error) {
      console.error('❌ Error generating access token:', error.message);
      return null;
    }
  }

  // Tạo Refresh Token (long-lived: 7 days)
  generateRefreshToken(userData) {
    try {
      const token = jwt.sign(userData, REFRESH_SECRET, {
        expiresIn: '7d' // Refresh token expire sau 7 ngày
      });
      
      // Lưu refresh token vào store (key: userId)
      refreshTokenStore.set(userData.id, token);
      
      console.log('✅ Refresh Token generated successfully');
      return token;
    } catch (error) {
      console.error('❌ Error generating refresh token:', error.message);
      return null;
    }
  }

  // Tạo cả Access Token + Refresh Token (dùng khi login)
  generateTokenPair(userData) {
    const accessToken = this.generateAccessToken(userData);
    const refreshToken = this.generateRefreshToken(userData);

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m' // Access token expires in 15 minutes
    };
  }

  // ==================== VERIFY TOKEN ====================
  
  // Verify Access Token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Access Token verified successfully');
      return decoded;
    } catch (error) {
      console.error('❌ Access Token verification failed:', error.message);
      return null;
    }
  }

  // Verify Refresh Token
  verifyRefreshToken(token, userId) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      
      // Kiểm tra refresh token có trong store không
      const storedToken = refreshTokenStore.get(userId);
      if (storedToken !== token) {
        console.error('❌ Refresh token mismatch');
        return null;
      }
      
      console.log('✅ Refresh Token verified successfully');
      return decoded;
    } catch (error) {
      console.error('❌ Refresh Token verification failed:', error.message);
      return null;
    }
  }

  // ==================== REFRESH TOKEN FLOW ====================
  
  // Refresh access token bằng refresh token
  refreshAccessToken(refreshToken, userId) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken, userId);
      if (!decoded) {
        return null;
      }

      // Tạo access token mới
      const newAccessToken = this.generateAccessToken({
        id: decoded.id,
        username: decoded.username
      });

      console.log('✅ Access Token refreshed successfully');
      return {
        accessToken: newAccessToken,
        expiresIn: '15m'
      };
    } catch (error) {
      console.error('❌ Error refreshing access token:', error.message);
      return null;
    }
  }

  // ==================== LOGOUT ====================
  
  // Logout (xóa refresh token khỏi store)
  logout(userId) {
    try {
      refreshTokenStore.delete(userId);
      console.log(`✅ User ${userId} logged out successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error logging out:', error.message);
      return false;
    }
  }

  // ==================== OLD METHODS (COMPATIBLE) ====================
  
  // Backward compatible: Tạo token (cũ - dùng access token)
  generateToken(userData) {
    try {
      const token = jwt.sign(userData, JWT_SECRET, {
        expiresIn: '24h'
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
