const axios = require('axios');

const GEMINI_API_KEY = "AIzaSyBkpBpE22FyiNaMwwVJ_8UYmAiWlj-xGQw";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

class GeminiChatService {
  constructor() {
    this.conversationHistory = {};
  }

  // Gửi message tới Gemini API
  async sendMessage(userId, userMessage) {
    try {
      // Lấy hoặc tạo lịch sử chat cho user này
      if (!this.conversationHistory[userId]) {
        this.conversationHistory[userId] = [];
      }

      // Thêm message của user vào lịch sử
      this.conversationHistory[userId].push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      // Tạo request payload
      const payload = {
        contents: this.conversationHistory[userId],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      // Gọi Gemini API
      const response = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Lấy response từ Gemini
      const aiMessage = response.data.candidates[0].content.parts[0].text;

      // Thêm response vào lịch sử
      this.conversationHistory[userId].push({
        role: "model",
        parts: [{ text: aiMessage }]
      });

      return {
        success: true,
        message: aiMessage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Gemini API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Xóa lịch sử chat của user
  clearHistory(userId) {
    if (this.conversationHistory[userId]) {
      delete this.conversationHistory[userId];
      return { success: true, message: `Chat history cleared for user ${userId}` };
    }
    return { success: false, message: `No conversation history found for user ${userId}` };
  }

  // Lấy lịch sử chat
  getHistory(userId) {
    return this.conversationHistory[userId] || [];
  }
}

module.exports = new GeminiChatService();
