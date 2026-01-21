const express = require('express');
const messageQueue = require('./messageQueue');
const jwtManager = require('./jwt');
const { ROLES, PERMISSIONS, hasPermission, getPermissionsForRole } = require('./roles');
const { THEMES, ThemeManager } = require('./theme');
const { authMiddleware, roleMiddleware, permissionMiddleware } = require('./middleware');
const chatRoutes = require('./chatRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

// Mount chat routes
app.use('/api', chatRoutes);

// Initialize Theme Manager
const themeManager = new ThemeManager();

// Fake database người dùng (with role)
const users = [
  { id: 1, username: 'admin', password: '123456', role: ROLES.ADMIN },
  { id: 2, username: 'user', password: 'password', role: ROLES.USER },
  { id: 3, username: 'moderator', password: 'mod123', role: ROLES.MODERATOR },
  { id: 4, username: 'guest', password: 'guest', role: ROLES.GUEST }
];

// ==================== JWT ROUTES ====================

// Login endpoint - Trả về Access Token + Refresh Token
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: '❌ Invalid username or password' });
  }
  // Tạo Access Token + Refresh Token (new way)
  const tokenPair = jwtManager.generateTokenPair({
    id: user.id,
    username: user.username,
    role: user.role,
    loginTime: new Date().toISOString()
  });

  res.json({
    message: '✅ Login successful',
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresIn: tokenPair.expiresIn,
    user: { 
      id: user.id, 
      username: user.username,
      role: user.role,
      permissions: getPermissionsForRole(user.role)
    }
  });
});

// Verify Access Token endpoint
app.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: '❌ Token is required' });
  }

  const decoded = jwtManager.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ message: '❌ Invalid or expired token' });
  }

  res.json({
    message: '✅ Access Token is valid',
    data: decoded
  });
});

// Refresh Token endpoint - Tạo Access Token mới
app.post('/refresh-token', (req, res) => {
  const { refreshToken, userId } = req.body;

  if (!refreshToken || !userId) {
    return res.status(400).json({ 
      message: '❌ Refresh token and userId are required' 
    });
  }

  const result = jwtManager.refreshAccessToken(refreshToken, userId);

  if (!result) {
    return res.status(401).json({ 
      message: '❌ Invalid or expired refresh token' 
    });
  }

  res.json({
    message: '✅ Access Token refreshed successfully',
    accessToken: result.accessToken,
    expiresIn: result.expiresIn
  });
});

// Logout endpoint - Xóa Refresh Token
app.post('/logout', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: '❌ userId is required' });
  }

  const success = jwtManager.logout(userId);

  if (success) {
    res.json({ message: '✅ Logged out successfully' });
  } else {
    res.status(500).json({ message: '❌ Logout failed' });
  }
});

// ==================== MESSAGE QUEUE ROUTES ====================

// Send message endpoint
app.post('/send-message', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: '❌ Message is required' });
  }

  const success = await messageQueue.sendMessage({
    content: message,
    timestamp: new Date().toISOString(),
    sender: req.body.sender || 'anonymous'
  });

  if (success) {
    res.json({ message: '✅ Message sent to queue successfully' });
  } else {
    res.status(500).json({ message: '❌ Failed to send message' });
  }
});

// ==================== ROLE & PERMISSION ROUTES ====================

// Get all available roles
app.get('/roles', (req, res) => {
  res.json({
    message: '✅ Available roles',
    roles: Object.values(ROLES)
  });
});

// Get all available permissions
app.get('/permissions', (req, res) => {
  res.json({
    message: '✅ Available permissions',
    permissions: Object.values(PERMISSIONS)
  });
});

// Get permissions for specific role
app.get('/roles/:role/permissions', (req, res) => {
  const { role } = req.params;

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: `❌ Invalid role: ${role}` });
  }

  const permissions = getPermissionsForRole(role);

  res.json({
    message: `✅ Permissions for role: ${role}`,
    role,
    permissions,
    count: permissions.length
  });
});

// Get current user info with permissions (protected)
app.get('/me', authMiddleware, (req, res) => {
  const userRole = req.user.role || ROLES.GUEST;
  const permissions = getPermissionsForRole(userRole);

  res.json({
    message: '✅ Current user info',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: userRole,
      permissions
    }
  });
});

// Test endpoint - Require specific role (ADMIN)
app.get('/admin-only', roleMiddleware(ROLES.ADMIN), (req, res) => {
  res.json({
    message: '✅ Only admin can access this',
    user: req.user
  });
});

// Test endpoint - Require specific permission
app.get('/products/manage', 
  authMiddleware,
  permissionMiddleware(PERMISSIONS.UPDATE_PRODUCT),
  (req, res) => {
    res.json({
      message: '✅ You can manage products',
      user: req.user
    });
  }
);

// ==================== THEME ROUTES ====================

// Get available themes
app.get('/themes', (req, res) => {
  const availableThemes = themeManager.getAvailableThemes();

  res.json({
    message: '✅ Available themes',
    themes: availableThemes
  });
});

// Get specific theme configuration
app.get('/themes/:themeName', (req, res) => {
  const { themeName } = req.params;

  const themeResponse = themeManager.getThemeResponse(themeName);

  res.json({
    message: `✅ Theme configuration: ${themeName}`,
    theme: themeResponse
  });
});

// Set user theme preference (protected)
app.post('/me/theme', authMiddleware, (req, res) => {
  const { theme } = req.body;
  const userId = req.user.id;

  if (!theme) {
    return res.status(400).json({ message: '❌ Theme is required' });
  }

  const success = themeManager.setUserTheme(userId, theme);

  if (!success) {
    return res.status(400).json({ 
      message: `❌ Invalid theme: ${theme}`,
      availableThemes: themeManager.getAvailableThemes()
    });
  }

  const themeResponse = themeManager.getThemeResponse(theme);

  res.json({
    message: '✅ Theme updated successfully',
    userId,
    theme: themeResponse
  });
});

// Get user's theme preference (protected)
app.get('/me/theme', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userTheme = themeManager.getUserTheme(userId);
  const themeResponse = themeManager.getThemeResponse(userTheme);

  res.json({
    message: '✅ User theme preference',
    userId,
    currentTheme: userTheme,
    theme: themeResponse
  });
});

// ==================== DEMO ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to MessageQueue & JWT & RBAC & Theme Demo',
    endpoints: {
      auth: {
        'POST /login': 'Login',
        'POST /verify-token': 'Verify token',
        'POST /refresh-token': 'Refresh access token',
        'POST /logout': 'Logout'
      },
      user: {
        'GET /me': 'Get current user info (requires auth)',
        'POST /me/theme': 'Set user theme (requires auth)',
        'GET /me/theme': 'Get user theme (requires auth)'
      },
      rbac: {
        'GET /roles': 'Get all available roles',
        'GET /permissions': 'Get all available permissions',
        'GET /roles/:role/permissions': 'Get permissions for a role',
        'GET /admin-only': 'Test endpoint - admin only',
        'GET /products/manage': 'Test endpoint - requires product update permission'
      },
      themes: {
        'GET /themes': 'Get available themes',
        'GET /themes/:themeName': 'Get theme configuration'
      },
      messageQueue: {
        'POST /send-message': 'Send message to queue'
      }
    },
    testUsers: [
      { username: 'admin', password: '123456', role: 'admin' },
      { username: 'user', password: 'password', role: 'user' },
      { username: 'moderator', password: 'mod123', role: 'moderator' },
      { username: 'guest', password: 'guest', role: 'guest' }
    ]
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Kết nối RabbitMQ
  await messageQueue.connect();

  // Consumer - lắng nghe message từ queue
  await messageQueue.consumeMessage(async (message) => {
    console.log('🔄 Processing message:', message);
    // Xử lý message ở đây
  });

  // Start Express server
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Server running on port ${PORT}          ║
║  📍 http://localhost:${PORT}                  ║
╚════════════════════════════════════════════╝
    `);
  });
}

// Xử lý graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n📛 Shutting down gracefully...');
  await messageQueue.close();
  process.exit(0);
});

// Start
startServer().catch(error => {
  console.error('❌ Startup error:', error);
  process.exit(1);
});
