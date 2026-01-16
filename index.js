const express = require('express');
const messageQueue = require('./messageQueue');
const jwtManager = require('./jwt');
require('dotenv').config();

const app = express();
app.use(express.json());

// Fake database người dùng
const users = [
  { id: 1, username: 'admin', password: '123456' },
  { id: 2, username: 'user', password: 'password' }
];

// ==================== JWT ROUTES ====================

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: '❌ Invalid username or password' });
  }

  // Tạo token
  const token = jwtManager.generateToken({
    id: user.id,
    username: user.username,
    loginTime: new Date().toISOString()
  });

  res.json({
    message: '✅ Login successful',
    token: token,
    user: { id: user.id, username: user.username }
  });
});

// Verify token endpoint
app.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: '❌ Token is required' });
  }

  const decoded = jwtManager.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: '❌ Invalid or expired token' });
  }

  res.json({
    message: '✅ Token is valid',
    data: decoded
  });
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

// ==================== DEMO ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to MessageQueue & JWT Demo',
    endpoints: {
      jwt: {
        'POST /login': 'Login (send { "username": "admin", "password": "123456" })',
        'POST /verify-token': 'Verify token (send { "token": "your_token" })'
      },
      messageQueue: {
        'POST /send-message': 'Send message to queue (send { "message": "your message", "sender": "user" })'
      }
    }
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
