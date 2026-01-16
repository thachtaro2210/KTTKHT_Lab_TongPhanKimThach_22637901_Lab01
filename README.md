# MessageQueue (RabbitMQ) & JWT Demo

Bài lab đơn giản về MessageQueue sử dụng RabbitMQ và JWT authentication.

## 📋 Yêu cầu

- Node.js >= 14
- RabbitMQ (chạy local hoặc trên server)
- npm packages: `amqplib`, `jsonwebtoken`, `express`, `dotenv`

## 🚀 Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cài đặt RabbitMQ (nếu chưa có)

**Windows (Chocolatey):**
```bash
choco install rabbitmq-server
```

**Windows (Manual):**
- Download từ https://www.rabbitmq.com/download.html
- Cài đặt Erlang trước
- Cài đặt RabbitMQ

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
```

**macOS:**
```bash
brew install rabbitmq
```

### 3. Start RabbitMQ

**Windows:**
```bash
rabbitmq-server.bat
```

**Linux/macOS:**
```bash
rabbitmq-server
```

### 4. Khởi động ứng dụng
```bash
npm start
# hoặc (watch mode)
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## 🔐 JWT Demo

### Login (Lấy token)
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

**Response:**
```json
{
  "message": "✅ Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

### Verify Token
```bash
curl -X POST http://localhost:3000/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## 📬 Message Queue Demo

### Gửi Message
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from MessageQueue","sender":"user1"}'
```

**Response:**
```json
{
  "message": "✅ Message sent to queue successfully"
}
```

## 📁 Cấu trúc File

```
.
├── index.js              # Main server file
├── messageQueue.js       # RabbitMQ producer & consumer
├── jwt.js               # JWT authentication
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md            # This file
```

## 🧪 Test với Postman

1. **Login:**
   - Method: POST
   - URL: `http://localhost:3000/login`
   - Body:
   ```json
   {
     "username": "admin",
     "password": "123456"
   }
   ```

2. **Verify Token:**
   - Method: POST
   - URL: `http://localhost:3000/verify-token`
   - Body:
   ```json
   {
     "token": "token_from_login_response"
   }
   ```

3. **Send Message:**
   - Method: POST
   - URL: `http://localhost:3000/send-message`
   - Body:
   ```json
   {
     "message": "Test message",
     "sender": "test_user"
   }
   ```

## 🔑 Tài khoản Test

| Username | Password |
|----------|----------|
| admin    | 123456   |
| user     | password |

## ⚙️ Cấu hình (.env)

```env
RABBITMQ_URL=amqp://localhost
JWT_SECRET=your_jwt_secret_key_123456789
PORT=3000
QUEUE_NAME=message_queue
```

## 🐛 Troubleshooting

### RabbitMQ không kết nối
- Kiểm tra RabbitMQ đã start: `http://localhost:15672` (default user: guest/guest)
- Kiểm tra URL trong `.env`

### Token không hợp lệ
- Token hết hạn sau 24 giờ
- Kiểm tra JWT_SECRET khớp nhau

### Message không được xử lý
- Kiểm tra RabbitMQ đang chạy
- Kiểm tra queue name trong `.env`

## 📚 Tài liệu

- [RabbitMQ Node.js](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html)
- [JWT.io](https://jwt.io)
- [Express.js](https://expressjs.com)

## 👤 Sinh viên
- Tôn Phan Kim Thạch - 22637901
