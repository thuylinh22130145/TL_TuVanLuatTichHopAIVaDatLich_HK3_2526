# server-api — Node.js Express + MySQL (Sequelize)

API trung tâm theo kiến trúc **Route → Controller → Service → Model**.

## Cấu trúc

```
server-api/
├── server.js                 # Entry — khởi động HTTP
├── sql/schema.sql            # DDL tham khảo
├── src/
│   ├── app.js                # Cấu hình Express
│   ├── config/               # env, database (Sequelize + mysql2)
│   ├── models/               # Lawyer, Booking, Staff
│   ├── controllers/
│   │   ├── public/
│   │   └── admin/
│   ├── services/             # Nghiệp vụ + aiService (mock/proxy)
│   ├── middleware/           # JWT auth, error handler
│   ├── routes/
│   ├── utils/                # bookingCode, ApiError
│   └── scripts/              # db:sync, db:seed
└── package.json
```

## API

### Public — `/api/public` (không cần token)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/lawyers` | Danh sách luật sư `active` |
| POST | `/bookings` | Tạo lịch, sinh `booking_code` `LAW-XXXX` |
| POST | `/chat` | Proxy Gemini/RAG + gợi ý ≤3 luật sư; tự lưu phiên khi có JWT khách hàng |

**POST /bookings** body:
```json
{
  "lawyer_id": 1,
  "customer_name": "...",
  "customer_phone": "...",
  "customer_email": "...",
  "appointment_date": "2026-06-10T09:00:00",
  "summary_issue": "..."
}
```

**POST /chat** body: `{ "message": "...", "session_id": 12 }`
`session_id` là tùy chọn. Với JWT của khách hàng, response trả thêm `sessionId` và server dùng lịch sử đã lưu thay cho lịch sử do client tự khai báo.

### Khách hàng — `/api/customer` (Bearer JWT, vai trò USER)

| Method | Path | Mô tả |
|--------|------|--------|
| GET/POST | `/bookings` | Xem hoặc tạo lịch của chính mình |
| PUT | `/bookings/:id` | Sửa lịch đang chờ xác nhận |
| PATCH | `/bookings/:id/cancel` | Hủy lịch đang chờ/đã xác nhận |
| GET | `/chat-sessions` | Danh sách phiên tư vấn đã lưu |
| GET | `/chat-sessions/:id` | Nội dung một phiên thuộc tài khoản |
| DELETE | `/chat-sessions/:id` | Xóa phiên và toàn bộ tin nhắn |

### Admin — `/api/admin`

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | Không |
| CRUD | `/lawyers`, `/bookings` | Bearer JWT |
| CRUD | `/documents` | Bearer JWT — proxy tới Server-AI |

## Cài đặt

1. Tạo database MySQL `law_firm_db`
2. Copy `.env.example` → `.env`
3. Chạy:

```bash
npm install
npm run db:seed
npm run dev
```

Mặc định: `http://localhost:3000` — staff `admin` / `admin123`

## Server-AI

Luôn proxy chat/tài liệu tới `AI_SERVICE_URL`. Nếu `server-ai` được cấu hình `GEMINI_API_KEY`, câu trả lời AI sẽ dùng Google Gemini thật và retrieval vector thực tế. Nếu chưa có key thì hệ thống còn giữ fallback cục bộ an toàn.

## Sinh mã đặt lịch

`src/utils/bookingCode.js` — `generateUniqueBookingCode()` kiểm tra trùng trong DB.
