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
| POST | `/chat` | Proxy AI (mock) + gợi ý ≤3 luật sư |

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

**POST /chat** body: `{ "message": "..." }`  
Response `data`: `{ answer, specialization, suggestBooking, suggestedLawyers[] }`

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

Luôn proxy chat/tài liệu tới `AI_SERVICE_URL`. Câu trả lời AI sinh bởi `mock_llm` trên server-ai (có thể thay LLM thật sau).

## Sinh mã đặt lịch

`src/utils/bookingCode.js` — `generateUniqueBookingCode()` kiểm tra trùng trong DB.
