const express = require('express');
const router = express.Router();
const geminiService = require('./gemini');

// Endpoint để gửi message tới Gemini
router.post('/chat', async (req, res) => {
  try {
    console.log('📨 Request body:', req.body);
    console.log('📨 Headers:', req.headers);
    
    const { userId, message } = req.body;

    // Validate input
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required',
        received: { userId, message }
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Gọi Gemini API
    const response = await geminiService.sendMessage(userId, message);

    if (response.success) {
      res.json({
        success: true,
        message: response.message,
        timestamp: response.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error,
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ Chat Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Endpoint để lấy lịch sử chat
router.get('/chat/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const history = geminiService.getHistory(userId);

    res.json({
      success: true,
      userId,
      history,
      totalMessages: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint để xóa lịch sử chat
router.delete('/chat/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = geminiService.clearHistory(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
